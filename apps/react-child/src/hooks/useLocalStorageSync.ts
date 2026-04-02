import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { storageService } from '../services/storageService';

/**
 * 将 Redux 状态同步到 LocalStorage，使用防抖避免频繁写入
 */
export function useLocalStorageSync(): void {
  const chat = useSelector((s: RootState) => s.chat);
  const ui = useSelector((s: RootState) => s.ui);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 500ms 防抖写入
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      storageService.saveConversations({
        conversations: chat.conversations,
        conversationOrder: chat.conversationOrder,
        activeConversationId: chat.activeConversationId,
      });
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [chat.conversations, chat.conversationOrder, chat.activeConversationId]);

  useEffect(() => {
    storageService.saveUI({
      theme: ui.theme,
      selectedModel: ui.selectedModel,
      sidebarCollapsed: ui.sidebarCollapsed,
    });
  }, [ui.theme, ui.selectedModel, ui.sidebarCollapsed]);
}
