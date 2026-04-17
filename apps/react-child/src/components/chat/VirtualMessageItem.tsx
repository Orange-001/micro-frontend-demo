import { memo, useRef, useEffect, useCallback } from 'react';
import type { Message } from '../../types/chat';
import { MessageBubble } from './MessageBubble';

interface VirtualMessageItemProps {
  message: Message;
  messageIndex: number;
  conversationId: string;
  onHeightChange: (index: number, height: number) => void;
}

/**
 * 虚拟滚动消息项包装器
 *
 * 职责：
 * 1. 渲染单个 MessageBubble
 * 2. 使用 ResizeObserver 测量实际高度
 * 3. 将高度变化上报给 useVirtualScroll 的 setItemHeight
 *
 * 为什么需要这个组件：
 * - 聊天消息的高度由 Markdown 内容决定，无法预知
 * - 流式输出时消息高度会持续增长
 * - ResizeObserver 能在内容变化时自动触发高度更新
 */
export const VirtualMessageItem = memo(function VirtualMessageItem({
  message,
  messageIndex,
  conversationId,
  onHeightChange,
}: VirtualMessageItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef(0);

  const handleResize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const height = el.getBoundingClientRect().height;
    // 只有高度真正变化时才上报（避免 ResizeObserver 循环触发）
    if (Math.abs(height - previousHeightRef.current) > 0.5) {
      previousHeightRef.current = height;
      onHeightChange(messageIndex, height);
    }
  }, [messageIndex, onHeightChange]);

  // 监听元素尺寸变化
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 初始化高度
    handleResize();

    const ro = new ResizeObserver(handleResize);
    ro.observe(el);

    return () => ro.disconnect();
  }, [handleResize]);

  return (
    <div ref={containerRef} style={{ width: '100%', overflow: 'hidden' }}>
      <MessageBubble message={message} conversationId={conversationId} />
    </div>
  );
});
