import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Tooltip, Tag } from 'antd';
import type { RootState } from '../../store';
import {
  estimateConversationTokens,
  formatTokenCount,
  COMPACT_TOKEN_THRESHOLD,
} from '../../utils/tokenEstimation';

export function TokenCounter() {
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const messages = activeId ? (conversations[activeId]?.messages ?? []) : [];

  const tokens = useMemo(() => estimateConversationTokens(messages), [messages]);

  if (messages.length === 0) return null;

  const color =
    tokens > COMPACT_TOKEN_THRESHOLD * 1.5
      ? 'red'
      : tokens > COMPACT_TOKEN_THRESHOLD
        ? 'orange'
        : 'default';

  return (
    <Tooltip title={`估算 ${tokens} tokens / ${messages.length} 条消息`}>
      <Tag color={color} style={{ cursor: 'default', fontSize: 12 }}>
        ~{formatTokenCount(tokens)}
      </Tag>
    </Tooltip>
  );
}
