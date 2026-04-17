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
  offsetTop: number; // 相对于列表顶部的绝对位置
  scrollTop: number; // 相对于可视区顶部的位置（用于绝对定位的 top）
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

  // 清空高度缓存（切换对话时调用）
  const resetHeightCache = useCallback(() => {
    heightCache.current.clear();
  }, []);

  // 监听滚动事件和容器尺寸
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

  // 计算可见范围和总高度
  const { visibleItems, totalHeight, startPadding, endPadding } = useMemo(() => {
    // 第一遍：计算所有项目的偏移位置和总高度
    const offsets: number[] = [];
    let offset = 0;
    for (let i = 0; i < itemCount; i++) {
      offsets.push(offset);
      offset += getItemHeight(i);
    }
    const total = offset;

    if (itemCount === 0 || containerHeight <= 0) {
      return { visibleItems: [] as VirtualItem[], totalHeight: 0, startPadding: 0, endPadding: 0 };
    }

    // 第二遍：二分查找确定可见范围
    const overscanTop = overscan * estimatedItemHeight;
    const overscanBottom = overscan * estimatedItemHeight;

    // 查找第一个 offset > scrollTop - overscanTop 的索引
    let startIndex = 0;
    let lo = 0;
    let hi = itemCount - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid] >= scrollTop - overscanTop) {
        startIndex = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    // 确保至少往前取一个
    startIndex = Math.max(0, startIndex - 1);

    // 查找最后一个 offset < scrollTop + containerHeight + overscanBottom 的索引
    let endIndex = itemCount - 1;
    lo = 0;
    hi = itemCount - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid] <= scrollTop + containerHeight + overscanBottom) {
        endIndex = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    // 确保至少往后取一个
    endIndex = Math.min(itemCount - 1, endIndex + 1);

    // 构建虚拟项目列表
    const items: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: offsets[i],
        scrollTop: offsets[i] - offsets[startIndex],
      });
    }

    // 计算可见区域内项目的总高度
    let renderedHeight = 0;
    for (let i = startIndex; i <= endIndex; i++) {
      renderedHeight += getItemHeight(i);
    }

    return {
      visibleItems: items,
      totalHeight: total,
      startPadding: offsets[startIndex] ?? 0,
      endPadding: total - (offsets[startIndex] ?? 0) - renderedHeight,
    };
  }, [itemCount, scrollTop, containerHeight, getItemHeight, overscan, estimatedItemHeight]);

  return {
    visibleItems,
    totalHeight,
    startPadding,
    endPadding,
    setItemHeight,
    resetHeightCache,
  };
}
