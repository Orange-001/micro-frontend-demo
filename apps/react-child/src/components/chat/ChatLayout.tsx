import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { useLocalStorageSync } from '../../hooks/useLocalStorageSync';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { chatActions } from '../../store/chatSlice';
import { uiActions } from '../../store/uiSlice';
import { Sidebar } from './Sidebar';
import { MainArea } from './MainArea';
import { CodeThemeStyle } from './CodeThemeStyle';
import { Wrapper } from './ChatLayout.styles';

export function ChatLayout() {
  const sidebarCollapsed = useSelector((s: RootState) => s.ui.sidebarCollapsed);
  const theme = useSelector((s: RootState) => s.ui.theme);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);
  const dispatch = useDispatch<AppDispatch>();

  // 持久化 Redux 到 LocalStorage
  useLocalStorageSync();

  const handleNewChat = useCallback(() => {
    dispatch(chatActions.createConversation({ model: selectedModel }));
  }, [dispatch, selectedModel]);

  const handleToggleSidebar = useCallback(() => {
    dispatch(uiActions.toggleSidebar());
  }, [dispatch]);

  const handleFocusInput = useCallback(() => {
    const input = document.querySelector(
      'textarea[placeholder="发送消息..."]',
    ) as HTMLTextAreaElement;
    input?.focus();
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (sidebarCollapsed) {
      dispatch(uiActions.setSidebarCollapsed(false));
    }
    const searchInput = document.querySelector(
      'input[placeholder="搜索对话..."]',
    ) as HTMLInputElement;
    searchInput?.focus();
  }, [sidebarCollapsed, dispatch]);

  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onToggleSidebar: handleToggleSidebar,
    onFocusInput: handleFocusInput,
    onSearchFocus: handleSearchFocus,
  });

  return (
    <Wrapper $collapsed={sidebarCollapsed} $theme={theme}>
      <CodeThemeStyle />
      <Sidebar />
      <MainArea />
    </Wrapper>
  );
}
