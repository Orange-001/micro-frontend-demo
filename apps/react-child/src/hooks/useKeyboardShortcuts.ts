/**
 * 全局键盘快捷键 Hook
 *
 * 快捷键默认值：
 * - ⌘/Ctrl + Shift + N  新建对话
 * - ⌘/Ctrl + /           聚焦输入框
 * - ⌘/Ctrl + K           聚焦侧边栏搜索
 * - ⌘/Ctrl + B           切换侧边栏
 * - Escape               停止流式输出（不可配置）
 *
 * 所有快捷键配置存储在 Redux config.shortcuts 中，支持用户自定义修改。
 * 配置自动持久化到 LocalStorage。
 */

import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { chatActions } from '../store/chatSlice';
import { uiActions } from '../store/uiSlice';
import { matchesKeys } from '../utils/shortcuts';

interface ShortcutsOptions {
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onFocusInput?: () => void;
  onSearchFocus?: () => void;
}

export function useKeyboardShortcuts(options: ShortcutsOptions = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const isStreaming = useSelector((s: RootState) => s.chat.isStreaming);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);
  const shortcuts = useSelector((s: RootState) => s.config.shortcuts);
  const optionsRef = useRef(options);

  optionsRef.current = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { onNewChat, onToggleSidebar, onFocusInput, onSearchFocus } = optionsRef.current;

      // Escape: 停止流式输出（不可配置，始终生效）
      if (e.key === 'Escape' && isStreaming) {
        e.preventDefault();
        return;
      }

      // 忽略在 input/textarea/select 中触发的快捷键（避免干扰正常输入）
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // 根据配置的快捷键映射动作
      const actions: Record<string, () => void> = {
        newChat:
          onNewChat ?? (() => dispatch(chatActions.createConversation({ model: selectedModel }))),
        focusInput:
          onFocusInput ??
          (() => {
            const input = document.querySelector(
              'textarea[placeholder="发送消息..."]',
            ) as HTMLTextAreaElement;
            input?.focus();
          }),
        focusSearch:
          onSearchFocus ??
          (() => {
            const search = document.querySelector(
              'input[placeholder="搜索对话..."]',
            ) as HTMLInputElement;
            search?.focus();
          }),
        toggleSidebar: onToggleSidebar ?? (() => dispatch(uiActions.toggleSidebar())),
      };

      for (const [actionId, keys] of Object.entries(shortcuts)) {
        if (!keys) continue;
        if (matchesKeys(e, keys) && actions[actionId]) {
          e.preventDefault();
          actions[actionId]();
          return;
        }
      }
    },
    [dispatch, selectedModel, isStreaming, shortcuts],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
