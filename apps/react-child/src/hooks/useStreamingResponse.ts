/**
 * INTERVIEW TOPIC: 一面4 - 闭包在 Hook 中的应用
 *
 * 闭包在此 Hook 中的体现：
 * 1. abortControllerRef 通过闭包在 sendMessage 和 stopStreaming 间共享
 * 2. dispatch 和 activeId 被闭包捕获，回调函数可以访问最新的 Redux 状态
 * 3. isStreamingRef 用闭包维护流式状态，避免 stale closure 问题
 */

import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { chatActions } from '../store/chatSlice';
import { streamChat, createStreamAbortController } from '../services/streamingService';
import { buildMemorySystemMessage } from '../utils/memoryBuilder';
import type { Message, APIConfig } from '../types/chat';

export function useStreamingResponse() {
  const dispatch = useDispatch<AppDispatch>();
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);
  const isStreaming = useSelector((s: RootState) => s.chat.isStreaming);
  const config = useSelector((s: RootState) => s.config);
  const memory = useSelector((s: RootState) => s.memory);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      let conversationId = activeId;

      if (!conversationId) {
        dispatch(chatActions.createConversation({ model: selectedModel }));
        return;
      }

      const conv = conversations[conversationId];

      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content,
        createdAt: Date.now(),
        isStreaming: false,
        reaction: null,
        attachments: [],
      };

      dispatch(chatActions.addMessage({ conversationId, message: userMessage }));

      const assistantMsgId = `msg-${Date.now()}-assistant`;
      dispatch(chatActions.startStreaming({ conversationId, messageId: assistantMsgId }));

      const controller = createStreamAbortController();
      abortControllerRef.current = controller;

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
        const apiConfig: APIConfig | undefined = config.apiKey
          ? config
          : undefined;

        const stream = streamChat(messages, {
          model: selectedModel,
          signal: controller.signal,
          apiConfig,
          systemMessage: systemMessage ?? undefined,
        });

        for await (const chunk of stream) {
          if (chunk.type === 'text') {
            dispatch(
              chatActions.appendStreamChunk({
                conversationId,
                content: chunk.content,
              }),
            );
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
        abortControllerRef.current = null;
      }
    },
    [activeId, conversations, dispatch, selectedModel, config, memory],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { sendMessage, stopStreaming, isStreaming };
}
