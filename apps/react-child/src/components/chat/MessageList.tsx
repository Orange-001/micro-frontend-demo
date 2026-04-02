/**
 * INTERVIEW TOPIC: 二面4 - useDeferredValue 延迟渲染优化
 *
 * 当流式消息快速更新时，useDeferredValue 允许 React 延迟渲染消息列表：
 * - 输入框和 UI 交互保持响应
 * - 消息列表渲染可以被新的更高优先级更新中断
 * - 避免流式更新导致的 UI 卡顿
 */

import { useRef, useEffect, useDeferredValue, useCallback, useState } from 'react';
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

  // INTERVIEW: 二面4 - useDeferredValue 延迟消息列表渲染
  const deferredMessages = useDeferredValue(messages);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const userScrolledRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      userScrolledRef.current = false;
      setShowScrollBtn(false);
    }
  }, []);

  // 检测用户是否手动滚动
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
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
  }, [deferredMessages, scrollToBottom]);

  if (!activeId) return null;

  return (
    <Wrapper ref={scrollRef}>
      <MessagesContainer>
        {deferredMessages.map((msg) => (
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
