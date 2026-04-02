/**
 * INTERVIEW TOPIC: 二面1 - 长列表（对话历史）的渲染性能优化
 *
 * 虚拟滚动（Virtual Scrolling）原理：
 * - 只渲染可视区域内（+ 上下缓冲区）的元素
 * - 超出可视区域的元素用 padding 占位
 * - 当用户滚动时动态计算需要渲染的元素范围
 *
 * 本实现特点（vs react-window）：
 * - 支持动态高度（消息内容长短不一）
 * - 使用估算高度 + 实际高度缓存的混合策略
 * - ResizeObserver 监听元素实际高度变化后更新缓存
 *
 * 为什么自定义实现而非使用 react-window：
 * - react-window 需要固定高度或手动提供高度函数
 * - 聊天消息的高度取决于 Markdown 渲染结果，无法预知
 * - 自定义实现可以更灵活地处理流式消息的动态高度变化
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  estimatedItemHeight: number;
  overscan?: number; // 缓冲区渲染的额外项数
  containerRef: React.RefObject<HTMLElement | null>;
}

interface VirtualItem {
  index: number;
  offsetTop: number;
}

export function useVirtualScroll({
  itemCount,
  estimatedItemHeight,
  overscan = 5,
  containerRef,
}: UseVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // 每个项目的实际高度缓存
  const heightCache = useRef<Map<number, number>>(new Map());

  // 获取某个项目的高度（有缓存用缓存，否则用估算值）
  const getItemHeight = useCallback(
    (index: number) => heightCache.current.get(index) ?? estimatedItemHeight,
    [estimatedItemHeight],
  );

  // 更新某个项目的实际高度
  const setItemHeight = useCallback((index: number, height: number) => {
    const cached = heightCache.current.get(index);
    if (cached !== height) {
      heightCache.current.set(index, height);
    }
  }, []);

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => setScrollTop(container.scrollTop);
    const handleResize = () => setContainerHeight(container.clientHeight);

    handleResize();
    container.addEventListener('scroll', handleScroll, { passive: true });

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      ro.disconnect();
    };
  }, [containerRef]);

  // 计算可见范围
  const { visibleItems, totalHeight, startPadding } = useMemo(() => {
    let offset = 0;
    let startIndex = -1;
    let endIndex = -1;
    const items: VirtualItem[] = [];

    for (let i = 0; i < itemCount; i++) {
      const h = getItemHeight(i);

      if (startIndex === -1 && offset + h > scrollTop - overscan * estimatedItemHeight) {
        startIndex = i;
      }

      if (startIndex !== -1 && endIndex === -1) {
        items.push({ index: i, offsetTop: offset });
      }

      offset += h;

      if (
        endIndex === -1 &&
        offset > scrollTop + containerHeight + overscan * estimatedItemHeight
      ) {
        endIndex = i;
      }
    }

    if (startIndex === -1) startIndex = 0;
    if (endIndex === -1) endIndex = itemCount - 1;

    return {
      visibleItems: items,
      totalHeight: offset,
      startPadding: items[0]?.offsetTop ?? 0,
    };
  }, [itemCount, scrollTop, containerHeight, getItemHeight, overscan, estimatedItemHeight]);

  return {
    visibleItems,
    totalHeight,
    startPadding,
    setItemHeight,
  };
}
