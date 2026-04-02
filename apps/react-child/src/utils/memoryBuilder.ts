import type { MemoryItem } from '../types/chat';

/**
 * 从 Memory 条目构建 system message
 * 返回 null 表示不需要注入 memory
 */
export function buildMemorySystemMessage(
  items: MemoryItem[],
  globalEnabled: boolean,
  conversationMemoryEnabled: boolean,
): string | null {
  if (!globalEnabled || !conversationMemoryEnabled) return null;

  const enabledItems = items.filter((i) => i.enabled);
  if (enabledItems.length === 0) return null;

  const lines = enabledItems.map((i) => `- ${i.content}`).join('\n');
  return `The user has shared the following preferences and information:\n${lines}\n\nUse this context to personalize your responses.`;
}
