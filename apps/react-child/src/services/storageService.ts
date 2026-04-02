/**
 * LocalStorage 持久化服务
 * 使用前缀隔离数据，防止微前端间的 key 冲突
 */

const PREFIX = 'chatgpt-clone';

const KEYS = {
  conversations: `${PREFIX}-conversations`,
  ui: `${PREFIX}-ui`,
} as const;

export const storageService = {
  saveConversations(data: unknown): void {
    try {
      localStorage.setItem(KEYS.conversations, JSON.stringify(data));
    } catch {
      console.warn('Failed to save conversations to localStorage');
    }
  },

  loadConversations<T>(): T | null {
    try {
      const raw = localStorage.getItem(KEYS.conversations);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveUI(data: unknown): void {
    try {
      localStorage.setItem(KEYS.ui, JSON.stringify(data));
    } catch {
      console.warn('Failed to save UI state to localStorage');
    }
  },

  loadUI<T>(): T | null {
    try {
      const raw = localStorage.getItem(KEYS.ui);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clear(): void {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
