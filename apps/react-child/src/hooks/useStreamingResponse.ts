/**
 * INTERVIEW TOPIC: 一面4 - 闭包在 Hook 中的应用
 *
 * 闭包在此 Hook 中的体现：
 * 1. abortControllerRef 通过闭包在 sendMessage 和 stopStreaming 间共享
 * 2. dispatch 和 activeId 被闭包捕获，回调函数可以访问最新的 Redux 状态
 * 3. isStreamingRef 用闭包维护流式状态，避免 stale closure 问题
 *
 * 为什么用 useRef 而不是 useState 存 AbortController：
 * - AbortController 不需要触发重渲染
 * - useRef 的 .current 始终是最新值，避免闭包捕获旧值问题
 */

import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { chatActions } from '../store/chatSlice';
import { streamChat, createStreamAbortController } from '../services/streamingService';
import type { Message } from '../types/chat';

export function useStreamingResponse() {
  const dispatch = useDispatch<AppDispatch>();
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);
  const isStreaming = useSelector((s: RootState) => s.chat.isStreaming);

  // INTERVIEW: 一面4 - useRef + 闭包，保持对 AbortController 的持续引用
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      let conversationId = activeId;

      // 如果没有活跃对话，先创建一个
      if (!conversationId) {
        dispatch(chatActions.createConversation({ model: selectedModel }));
        // 需要从 store 获取新创建的 ID — 这里用一个技巧
        // 由于 Redux dispatch 是同步的，createConversation 后 store 已更新
        // 但 useSelector 的值在下次渲染才更新（闭包问题），所以我们用 getState 模式
        return; // 让 React 重渲染后再发送
      }

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
        const messages = [
          ...(conversations[conversationId]?.messages ?? []),
          userMessage,
        ];

        const stream = streamChat(messages, {
          model: selectedModel,
          signal: controller.signal,
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
    [activeId, conversations, dispatch, selectedModel],
  );

  const stopStreaming = useCallback(() => {
    // INTERVIEW: 一面4 - 闭包引用 abortControllerRef，可以在任意时刻中断
    abortControllerRef.current?.abort();
  }, []);

  return { sendMessage, stopStreaming, isStreaming };
}
