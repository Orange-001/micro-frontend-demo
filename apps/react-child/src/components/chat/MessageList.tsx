/**
 * INTERVIEW TOPIC: 二面4 - useDeferredValue 延迟渲染优化
 *
 * useDeferredValue 的使用需注意场景：
 * - 适合搜索过滤等"输入 → 列表"场景（Sidebar 搜索已使用 useTransition）
 * - 不适合流式输出场景：会导致流式文字累积后一次性显示，失去打字机效果
 * - 因此消息列表直接使用 messages，保证每个 chunk dispatch 后立即渲染
 *
 * React 18 自动批处理 (Automatic Batching)：
 * - 在 async 函数中的多次 setState/dispatch 会被合并为一次渲染
 * - 流式场景中每个 chunk 独立 dispatch，React 会在微任务间逐帧渲染
 * - 如果仍有延迟，可通过 flushSync 强制同步渲染（但通常不需要）
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { MessageBubble } from './MessageBubble';
import { ScrollToBottom } from './ScrollToBottom';
import { Wrapper, MessagesContainer } from './MessageList.styles';

export function MessageList() {
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const isStreaming = useSelector((s: RootState) => s.chat.isStreaming);
  const messages = activeId ? conversations[activeId]?.messages ?? [] : [];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const userScrolledRef = useRef(false);

  const isProgrammaticScroll = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      isProgrammaticScroll.current = true;
      el.scrollTop = el.scrollHeight;
      userScrolledRef.current = false;
      setShowScrollBtn(false);
      // smooth 动画结束后才解除标记
      setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
    }
  }, []);

  // 检测用户是否手动滚动
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      // 程序触发的滚动不算用户手动滚动
      if (isProgrammaticScroll.current) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      userScrolledRef.current = !isAtBottom;
      setShowScrollBtn(!isAtBottom);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // 自动滚动到底部（仅在流式输出且用户未手动滚动时）
  useEffect(() => {
    if (!userScrolledRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // 监听内容区高度变化（Mermaid 异步渲染、图片加载等），自动滚底
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!userScrolledRef.current) scrollToBottom();
    });
    // 观察内部内容容器，尺寸变化时触发
    Array.from(el.children).forEach((child) => ro.observe(child));
    return () => ro.disconnect();
  }, [messages, scrollToBottom]);

  if (!activeId) return null;

  return (
    <Wrapper ref={scrollRef}>
      <MessagesContainer>
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            conversationId={activeId}
          />
        ))}
      </MessagesContainer>
      {showScrollBtn && <ScrollToBottom onClick={scrollToBottom} />}
    </Wrapper>
  );
}
