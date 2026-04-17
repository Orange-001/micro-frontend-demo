/**
 * INTERVIEW TOPIC: 二面1 - 长列表（对话历史）的渲染性能优化 + 二面4 - useDeferredValue 延迟渲染优化
 *
 * 虚拟滚动集成：
 * - 当消息数量超过阈值（VIRT_THRESHOLD = 50）时启用虚拟滚动
 * - 使用 useVirtualScroll hook 计算可见范围内的消息
 * - VirtualMessageItem 通过 ResizeObserver 上报实际高度
 * - 切换对话时清空高度缓存并自动滚动到底部
 *
 * React 18 自动批处理：
 * - 在 async 函数中的多次 setState/dispatch 会被合并为一次渲染
 * - 流式场景中每个 chunk 独立 dispatch，React 会在微任务间逐帧渲染
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { MessageBubble } from './MessageBubble';
import { VirtualMessageItem } from './VirtualMessageItem';
import { ScrollToBottom } from './ScrollToBottom';
import { useVirtualScroll } from '../../hooks/useVirtualScroll';
import { Wrapper, MessagesContainer, VirtualItem } from './MessageList.styles';

// 启用虚拟滚动的消息数量阈值
const VIRT_THRESHOLD = 50;
// 估算的消息高度（用于初始计算，ResizeObserver 会更新为实际值）
const ESTIMATED_ITEM_HEIGHT = 120;

export function MessageList() {
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const isStreaming = useSelector((s: RootState) => s.chat.isStreaming);
  const messages = activeId ? conversations[activeId]?.messages ?? [] : [];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const userScrolledRef = useRef(false);
  const isProgrammaticScroll = useRef(false);

  // 虚拟滚动 hook（始终初始化，即使未启用虚拟滚动）
  const { visibleItems, totalHeight, setItemHeight, resetHeightCache } =
    useVirtualScroll({
      itemCount: messages.length,
      estimatedItemHeight: ESTIMATED_ITEM_HEIGHT,
      overscan: 5,
      containerRef: scrollRef,
    });

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      isProgrammaticScroll.current = true;
      el.scrollTop = el.scrollHeight;
      userScrolledRef.current = false;
      setShowScrollBtn(false);
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }
  }, []);

  // 检测用户是否手动滚动
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      userScrolledRef.current = !isAtBottom;
      setShowScrollBtn(!isAtBottom);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // 切换对话时：重置滚动状态、清空高度缓存、强制滚底
  useEffect(() => {
    userScrolledRef.current = false;
    resetHeightCache();
    // 使用 requestAnimationFrame 确保 DOM 更新后再滚动
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [activeId, resetHeightCache, scrollToBottom]);

  // 自动滚动到底部（流式输出且用户未手动滚动时）
  useEffect(() => {
    if (!userScrolledRef.current && isStreaming) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom, isStreaming]);

  // 监听内容区高度变化（Mermaid 异步渲染、图片加载等），自动滚底
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!userScrolledRef.current) scrollToBottom();
    });
    Array.from(el.children).forEach((child) => ro.observe(child));
    return () => ro.disconnect();
  }, [activeId, scrollToBottom]);

  if (!activeId) return null;

  const useVirtual = messages.length >= VIRT_THRESHOLD;

  return (
    <Wrapper ref={scrollRef}>
      <MessagesContainer style={{ height: useVirtual ? totalHeight : undefined }}>
        {useVirtual ? (
          visibleItems.map((virtItem) => {
            const msg = messages[virtItem.index];
            if (!msg) return null;
            return (
              <VirtualItem key={msg.id} $offsetTop={virtItem.offsetTop}>
                <VirtualMessageItem
                  message={msg}
                  messageIndex={virtItem.index}
                  conversationId={activeId}
                  onHeightChange={setItemHeight}
                />
              </VirtualItem>
            );
          })
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} conversationId={activeId} />
          ))
        )}
      </MessagesContainer>
      {showScrollBtn && <ScrollToBottom onClick={scrollToBottom} />}
    </Wrapper>
  );
}
