import type { ConversationSummary, DateGroup, DateGroupedConversations } from '../types/chat';

const DAY_MS = 86400000;

function getDateGroup(timestamp: number): DateGroup {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = todayStart - timestamp;

  if (timestamp >= todayStart) return 'Today';
  if (diff < DAY_MS) return 'Yesterday';
  if (diff < 7 * DAY_MS) return 'Previous 7 Days';
  if (diff < 30 * DAY_MS) return 'Previous 30 Days';
  return 'Older';
}

const GROUP_ORDER: DateGroup[] = [
  'Today',
  'Yesterday',
  'Previous 7 Days',
  'Previous 30 Days',
  'Older',
];

export function groupConversationsByDate(
  conversations: ConversationSummary[],
): DateGroupedConversations[] {
  const groups = new Map<DateGroup, ConversationSummary[]>();

  // 按 updatedAt 降序排列
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  for (const conv of sorted) {
    const group = getDateGroup(conv.updatedAt);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(conv);
  }

  return GROUP_ORDER.filter((g) => groups.has(g)).map((group) => ({
    group,
    conversations: groups.get(group)!,
  }));
}
