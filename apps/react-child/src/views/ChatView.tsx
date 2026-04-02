/**
 * INTERVIEW TOPIC: 三面3 - 性能优化（React.lazy + 代码分割）
 *
 * ChatView 作为页面入口：
 * - 使用 React.memo 避免不必要的重渲染
 * - 未来可通过 React.lazy 按需加载子组件（如 MarkdownRenderer）
 * - 启动时从 LocalStorage 恢复状态
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { chatActions } from '../store/chatSlice';
import { uiActions } from '../store/uiSlice';
import { storageService } from '../services/storageService';
import { ChatLayout } from '../components/chat/ChatLayout';

export function ChatView() {
  const dispatch = useDispatch();

  // 启动时从 LocalStorage 恢复状态
  useEffect(() => {
    const savedChat = storageService.loadConversations<{
      conversations: Record<string, any>;
      conversationOrder: string[];
      activeConversationId: string | null;
    }>();
    if (savedChat) {
      dispatch(chatActions.loadFromStorage(savedChat));
    }

    const savedUI = storageService.loadUI<{
      theme: 'light' | 'dark';
      selectedModel: string;
      sidebarCollapsed: boolean;
    }>();
    if (savedUI) {
      dispatch(uiActions.loadFromStorage(savedUI));
    }
  }, [dispatch]);

  return <ChatLayout />;
}
