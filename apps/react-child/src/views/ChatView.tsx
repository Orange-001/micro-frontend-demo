/**
 * INTERVIEW TOPIC: 三面3 - 性能优化（React.lazy + 代码分割）
 *
 * ChatView 作为页面入口：
 * - 启动时从 LocalStorage 恢复所有状态（chat, ui, config, memory）
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { chatActions } from '../store/chatSlice';
import { uiActions } from '../store/uiSlice';
import { configActions } from '../store/configSlice';
import { memoryActions } from '../store/memorySlice';
import { storageService } from '../services/storageService';
import { ChatLayout } from '../components/chat/ChatLayout';
import type { APIConfig, MemoryItem } from '../types/chat';
import type { ShortcutsConfig } from '../utils/shortcuts';

export function ChatView() {
  const dispatch = useDispatch();

  useEffect(() => {
    const savedChat = storageService.loadConversations<{
      conversations: Record<string, any>;
      conversationOrder: string[];
      activeConversationId: string | null;
    }>();
    if (savedChat) dispatch(chatActions.loadFromStorage(savedChat));

    const savedUI = storageService.loadUI<{
      theme: 'light' | 'dark';
      selectedModel: string;
      sidebarCollapsed: boolean;
    }>();
    if (savedUI) dispatch(uiActions.loadFromStorage(savedUI));

    const savedConfig = storageService.loadConfig<
      Partial<APIConfig> & { shortcuts?: ShortcutsConfig }
    >();
    if (savedConfig) dispatch(configActions.loadFromStorage(savedConfig));

    const savedMemory = storageService.loadMemory<{
      items: MemoryItem[];
      globalEnabled: boolean;
    }>();
    if (savedMemory) dispatch(memoryActions.loadFromStorage(savedMemory));
  }, [dispatch]);

  return <ChatLayout />;
}
