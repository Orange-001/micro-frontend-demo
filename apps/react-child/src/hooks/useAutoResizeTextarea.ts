import { useCallback, useEffect, useRef } from 'react';

/**
 * 输入框自动高度调整 Hook
 * 根据内容自动伸缩，最大不超过指定行数
 */
export function useAutoResizeTextarea(maxRows = 6) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 24;
    const maxHeight = lineHeight * maxRows;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [maxRows]);

  useEffect(() => {
    resize();
  }, [resize]);

  return { textareaRef, resize };
}
