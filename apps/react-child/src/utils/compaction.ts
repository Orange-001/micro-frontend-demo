import type { Message } from '../types/chat';

/**
 * 将消息分为 "待压缩" 和 "保留" 两部分
 * 保留最近 keepRecentCount 条消息不压缩
 */
export function getCompactionCandidates(
  messages: Message[],
  keepRecentCount = 6,
): { toCompact: Message[]; toKeep: Message[] } {
  if (messages.length <= keepRecentCount) {
    return { toCompact: [], toKeep: messages };
  }
  const splitAt = messages.length - keepRecentCount;
  return {
    toCompact: messages.slice(0, splitAt),
    toKeep: messages.slice(splitAt),
  };
}

/**
 * 构建压缩提示词 — 发给 AI 生成摘要
 */
export function buildCompactionPrompt(messagesToCompact: Message[]): Message[] {
  const conversationText = messagesToCompact
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n\n');

  return [
    {
      id: 'compact-system',
      role: 'system' as const,
      content:
        'Summarize the following conversation concisely, preserving key facts, decisions, context, and any code snippets or technical details. The summary will replace these messages as context for future conversation. Write in the same language as the conversation.',
      createdAt: Date.now(),
      isStreaming: false,
      reaction: null,
      attachments: [],
    },
    {
      id: 'compact-user',
      role: 'user' as const,
      content: conversationText,
      createdAt: Date.now(),
      isStreaming: false,
      reaction: null,
      attachments: [],
    },
  ];
}

/**
 * 无 API Key 时的本地降级摘要 — 提取每条消息的第一句话
 */
export function formatLocalSummary(messages: Message[]): string {
  const lines = messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      const firstSentence = m.content.split(/[。！？.!?\n]/)[0]?.trim() || m.content.slice(0, 80);
      return `[${m.role}] ${firstSentence}`;
    });
  return `Previous conversation summary (${messages.length} messages):\n${lines.join('\n')}`;
}
