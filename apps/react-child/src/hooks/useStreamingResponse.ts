/**
 * INTERVIEW TOPIC: 一面4 - 闭包在 Hook 中的应用
 *
 * 闭包在此 Hook 中的体现：
 * 1. abortControllerRef 通过闭包在 sendMessage 和 stopStreaming 间共享
 * 2. dispatch 和 activeId 被闭包捕获，回调函数可以访问最新的 Redux 状态
 */

import { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { chatActions } from '../store/chatSlice';
import { streamChat, createStreamAbortController } from '../services/streamingService';
import { buildMemorySystemMessage } from '../utils/memoryBuilder';
import type { Message, APIConfig, PendingFileAttachment } from '../types/chat';
import { useChatConfigGuard } from './useChatConfigGuard';

/**
 * INTERVIEW TOPIC: 二面2 - 流式渲染与浏览器重绘机制
 *
 * 为什么 for await + dispatch 不会逐字渲染：
 * - for await...of 基于 Promise（微任务 microtask）
 * - 浏览器的 paint 在宏任务（macrotask）之间执行
 * - 微任务队列会在当前宏任务结束前全部清空
 * - 所以即使 React 同步更新了 DOM，浏览器也不会在微任务间重绘
 *
 * 解决方案：
 * - 在每次 dispatch 后用 setTimeout(0) 让出主线程
 * - 这样浏览器有机会在两次 dispatch 之间执行 paint
 * - 实现真正的逐字打字机效果
 */
function frameYield(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

let currentAbortController: AbortController | null = null;

export function useStreamingResponse() {
  const dispatch = useDispatch<AppDispatch>();
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);
  const isStreaming = useSelector((s: RootState) => s.chat.isStreaming);
  const config = useSelector((s: RootState) => s.config);
  const memory = useSelector((s: RootState) => s.memory);
  const deepThinkingEnabled = useSelector((s: RootState) => s.ui.deepThinkingEnabled);
  const webSearchEnabled = useSelector((s: RootState) => s.ui.webSearchEnabled);
  const ensureChatConfigured = useChatConfigGuard();

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, attachments?: PendingFileAttachment[]) => {
      if (!ensureChatConfigured()) return;

      const conversationId = activeId;

      if (!conversationId) {
        dispatch(chatActions.createConversation({ model: selectedModel }));
        return;
      }

      const conv = conversations[conversationId];

      // 将文本文件内容内联到消息文本中
      let fullContent = content;
      const textFiles = attachments?.filter((f) => !f.preview) ?? [];
      for (const tf of textFiles) {
        fullContent += `\n\n--- File: ${tf.name} ---\n${tf.content}`;
      }

      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: fullContent,
        createdAt: Date.now(),
        isStreaming: false,
        reaction: null,
        attachments: (attachments ?? []).map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          url: f.preview || '',
        })),
      };

      dispatch(chatActions.addMessage({ conversationId, message: userMessage }));

      const assistantMsgId = `msg-${Date.now()}-assistant`;
      dispatch(chatActions.startStreaming({ conversationId, messageId: assistantMsgId }));

      const controller = createStreamAbortController();
      abortControllerRef.current = controller;
      currentAbortController = controller;

      try {
        // 过滤掉错误消息，避免将之前的 API 错误发送给模型
        const cleanMessages = (conv?.messages ?? []).filter(
          (m) => !m.content.includes('⚠️ Error:') && !m.content.includes('⚠️ 请求失败:'),
        );
        const messages = [...cleanMessages, userMessage];

        // 构建 Memory system message
        const systemMessage = buildMemorySystemMessage(
          memory.items,
          memory.globalEnabled,
          conv?.memoryEnabled ?? true,
        );

        // 构建 API 配置（仅当有 apiKey 时传入）
        const apiConfig: APIConfig | undefined = config.apiKey ? config : undefined;

        // 仅传递图片附件（有 preview 的为图片）
        const imageAttachments = attachments?.filter((f) => f.preview) ?? [];

        const stream = streamChat(messages, {
          model: selectedModel,
          signal: controller.signal,
          apiConfig,
          systemMessage: systemMessage ?? undefined,
          deepThinking: deepThinkingEnabled,
          webSearch: webSearchEnabled,
          attachments: imageAttachments,
        });

        let isInReasoning = false;

        for await (const chunk of stream) {
          if (chunk.type === 'reasoning') {
            // 推理模型 thinking 阶段：用 blockquote 展示思考过程
            let prefix = '';
            if (!isInReasoning) {
              isInReasoning = true;
              prefix = '> **💭 思考过程**\n>\n> ';
            }
            // 将换行转为 blockquote 续行
            const quotedContent = chunk.content.replace(/\n/g, '\n> ');
            flushSync(() => {
              dispatch(
                chatActions.appendStreamChunk({
                  conversationId,
                  content: prefix + quotedContent,
                }),
              );
            });
            await frameYield();
          } else if (chunk.type === 'text') {
            // 从 reasoning 切换到正文时，插入分隔
            let prefix = '';
            if (isInReasoning) {
              isInReasoning = false;
              prefix = '\n\n---\n\n';
            }
            flushSync(() => {
              dispatch(
                chatActions.appendStreamChunk({
                  conversationId,
                  content: prefix + chunk.content,
                }),
              );
            });
            await frameYield();
          } else if (chunk.type === 'error') {
            dispatch(
              chatActions.appendStreamChunk({
                conversationId,
                content: `\n\n⚠️ Error: ${chunk.content}`,
              }),
            );
            break;
          }
        }

        // 流结束时如果仍在 reasoning 阶段，插入分隔线
        if (isInReasoning) {
          dispatch(
            chatActions.appendStreamChunk({
              conversationId,
              content: '\n\n---\n\n',
            }),
          );
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          dispatch(
            chatActions.appendStreamChunk({
              conversationId,
              content: `\n\n⚠️ 请求失败: ${error.message}`,
            }),
          );
        }
      } finally {
        dispatch(chatActions.finalizeStreaming(conversationId));
        if (currentAbortController === controller) currentAbortController = null;
        abortControllerRef.current = null;
      }
    },
    [
      activeId,
      conversations,
      dispatch,
      selectedModel,
      config,
      memory,
      deepThinkingEnabled,
      webSearchEnabled,
      ensureChatConfigured,
    ],
  );

  /**
   * 编辑历史消息并重新生成回复
   * - 调用 editUserMessage 更新消息内容并截断后续消息
   * - 以截断后的消息列表作为上下文重新请求 API
   */
  const editAndResendMessage = useCallback(
    async (conversationId: string, messageId: string, newContent: string) => {
      if (!ensureChatConfigured()) return;

      // 1. 更新消息并截断后续内容
      dispatch(chatActions.editUserMessage({ conversationId, messageId, content: newContent }));

      const conv = conversations[conversationId];
      const messages = (conv?.messages ?? []).filter(
        (m) => !m.content.includes('⚠️ Error:') && !m.content.includes('⚠️ 请求失败:'),
      );

      const assistantMsgId = `msg-${Date.now()}-assistant`;
      dispatch(chatActions.startStreaming({ conversationId, messageId: assistantMsgId }));

      const controller = createStreamAbortController();
      abortControllerRef.current = controller;
      currentAbortController = controller;

      const systemMessage = buildMemorySystemMessage(
        memory.items,
        memory.globalEnabled,
        conv?.memoryEnabled ?? true,
      );

      const apiConfig: APIConfig | undefined = config.apiKey ? config : undefined;

      try {
        const stream = streamChat(messages, {
          model: selectedModel,
          signal: controller.signal,
          apiConfig,
          systemMessage: systemMessage ?? undefined,
          deepThinking: deepThinkingEnabled,
          webSearch: webSearchEnabled,
        });

        let isInReasoning = false;

        for await (const chunk of stream) {
          if (chunk.type === 'reasoning') {
            let prefix = '';
            if (!isInReasoning) {
              isInReasoning = true;
              prefix = '> **💭 思考过程**\n>\n> ';
            }
            const quotedContent = chunk.content.replace(/\n/g, '\n> ');
            flushSync(() => {
              dispatch(
                chatActions.appendStreamChunk({
                  conversationId,
                  content: prefix + quotedContent,
                }),
              );
            });
            await frameYield();
          } else if (chunk.type === 'text') {
            let prefix = '';
            if (isInReasoning) {
              isInReasoning = false;
              prefix = '\n\n---\n\n';
            }
            flushSync(() => {
              dispatch(
                chatActions.appendStreamChunk({
                  conversationId,
                  content: prefix + chunk.content,
                }),
              );
            });
            await frameYield();
          } else if (chunk.type === 'error') {
            dispatch(
              chatActions.appendStreamChunk({
                conversationId,
                content: `\n\n⚠️ Error: ${chunk.content}`,
              }),
            );
            break;
          }
        }

        if (isInReasoning) {
          dispatch(
            chatActions.appendStreamChunk({
              conversationId,
              content: '\n\n---\n\n',
            }),
          );
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          dispatch(
            chatActions.appendStreamChunk({
              conversationId,
              content: `\n\n⚠️ 请求失败: ${error.message}`,
            }),
          );
        }
      } finally {
        dispatch(chatActions.finalizeStreaming(conversationId));
        if (currentAbortController === controller) currentAbortController = null;
        abortControllerRef.current = null;
      }
    },
    [
      conversations,
      dispatch,
      selectedModel,
      config,
      memory,
      deepThinkingEnabled,
      webSearchEnabled,
      ensureChatConfigured,
    ],
  );

  const regenerateMessage = useCallback(
    async (conversationId: string, assistantMessageId: string) => {
      if (!ensureChatConfigured() || isStreaming) return;

      const conv = conversations[conversationId];
      if (!conv) return;

      const assistantIndex = conv.messages.findIndex((m) => m.id === assistantMessageId);
      if (assistantIndex === -1) return;

      const messages = conv.messages
        .slice(0, assistantIndex)
        .filter((m) => !m.content.includes('⚠️ Error:') && !m.content.includes('⚠️ 请求失败:'));

      const hasUserPrompt = messages.some((m) => m.role === 'user');
      if (!hasUserPrompt) return;

      dispatch(chatActions.deleteMessagesFrom({ conversationId, startIndex: assistantIndex }));

      const assistantMsgId = `msg-${Date.now()}-assistant`;
      dispatch(chatActions.startStreaming({ conversationId, messageId: assistantMsgId }));

      const controller = createStreamAbortController();
      abortControllerRef.current = controller;
      currentAbortController = controller;

      const systemMessage = buildMemorySystemMessage(
        memory.items,
        memory.globalEnabled,
        conv.memoryEnabled ?? true,
      );

      const apiConfig: APIConfig | undefined = config.apiKey ? config : undefined;

      try {
        const stream = streamChat(messages, {
          model: selectedModel,
          signal: controller.signal,
          apiConfig,
          systemMessage: systemMessage ?? undefined,
          deepThinking: deepThinkingEnabled,
          webSearch: webSearchEnabled,
        });

        let isInReasoning = false;

        for await (const chunk of stream) {
          if (chunk.type === 'reasoning') {
            let prefix = '';
            if (!isInReasoning) {
              isInReasoning = true;
              prefix = '> **💭 思考过程**\n>\n> ';
            }
            const quotedContent = chunk.content.replace(/\n/g, '\n> ');
            flushSync(() => {
              dispatch(
                chatActions.appendStreamChunk({
                  conversationId,
                  content: prefix + quotedContent,
                }),
              );
            });
            await frameYield();
          } else if (chunk.type === 'text') {
            let prefix = '';
            if (isInReasoning) {
              isInReasoning = false;
              prefix = '\n\n---\n\n';
            }
            flushSync(() => {
              dispatch(
                chatActions.appendStreamChunk({
                  conversationId,
                  content: prefix + chunk.content,
                }),
              );
            });
            await frameYield();
          } else if (chunk.type === 'error') {
            dispatch(
              chatActions.appendStreamChunk({
                conversationId,
                content: `\n\n⚠️ Error: ${chunk.content}`,
              }),
            );
            break;
          }
        }

        if (isInReasoning) {
          dispatch(
            chatActions.appendStreamChunk({
              conversationId,
              content: '\n\n---\n\n',
            }),
          );
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          dispatch(
            chatActions.appendStreamChunk({
              conversationId,
              content: `\n\n⚠️ 请求失败: ${error.message}`,
            }),
          );
        }
      } finally {
        dispatch(chatActions.finalizeStreaming(conversationId));
        if (currentAbortController === controller) currentAbortController = null;
        abortControllerRef.current = null;
      }
    },
    [
      conversations,
      dispatch,
      selectedModel,
      config,
      memory,
      deepThinkingEnabled,
      webSearchEnabled,
      ensureChatConfigured,
      isStreaming,
    ],
  );

  const stopStreaming = useCallback(() => {
    const controller = abortControllerRef.current ?? currentAbortController;
    controller?.abort();
    abortControllerRef.current = null;
    if (currentAbortController === controller) currentAbortController = null;
    if (activeId) dispatch(chatActions.finalizeStreaming(activeId));
  }, [activeId, dispatch]);

  return { sendMessage, editAndResendMessage, regenerateMessage, stopStreaming, isStreaming };
}
