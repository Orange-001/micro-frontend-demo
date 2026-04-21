import { useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { message as antdMessage } from 'antd';
import type { RootState, AppDispatch } from '../store';
import { chatActions } from '../store/chatSlice';
import {
  estimateConversationTokens,
  COMPACT_MESSAGE_THRESHOLD,
  COMPACT_TOKEN_THRESHOLD,
} from '../utils/tokenEstimation';
import {
  getCompactionCandidates,
  buildCompactionPrompt,
  formatLocalSummary,
} from '../utils/compaction';
import { streamChat } from '../services/streamingService';

export type CompactionState = 'idle' | 'compacting' | 'success' | 'error';

export function useCompaction() {
  const dispatch = useDispatch<AppDispatch>();
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const config = useSelector((s: RootState) => s.config);
  const messages = activeId ? (conversations[activeId]?.messages ?? []) : [];
  const [state, setState] = useState<CompactionState>('idle');
  const [dismissed, setDismissed] = useState(false);

  const estimatedTokens = useMemo(() => estimateConversationTokens(messages), [messages]);

  const shouldSuggestCompaction =
    !dismissed &&
    state === 'idle' &&
    (messages.length > COMPACT_MESSAGE_THRESHOLD || estimatedTokens > COMPACT_TOKEN_THRESHOLD);

  const compact = useCallback(async () => {
    if (!activeId) return;
    setState('compacting');

    try {
      let { toCompact } = getCompactionCandidates(messages);

      // 即使没有可压缩候选（消息数 <= keepRecentCount），也允许压缩全部消息
      if (toCompact.length === 0) {
        toCompact = [...messages];
      }

      let summary: string;

      if (config.apiKey) {
        // 有 API Key: 调用 AI 生成摘要
        const promptMessages = buildCompactionPrompt(toCompact);
        let collected = '';
        const stream = streamChat(promptMessages, {
          model: config.defaultModel,
          apiConfig: config,
        });
        for await (const chunk of stream) {
          if (chunk.type === 'text') collected += chunk.content;
        }
        summary = collected || formatLocalSummary(toCompact);
      } else {
        // 无 API Key: 本地降级摘要
        summary = formatLocalSummary(toCompact);
      }

      dispatch(
        chatActions.compactMessages({
          conversationId: activeId,
          summaryContent: summary,
          replacedCount: toCompact.length,
        }),
      );

      setState('success');
      antdMessage.success(`已压缩 ${toCompact.length} 条消息`);
    } catch (err) {
      console.error('Compaction failed:', err);
      setState('error');
      antdMessage.error('压缩失败，请重试');
    }
  }, [activeId, messages, config, dispatch]);

  const dismiss = useCallback(() => setDismissed(true), []);

  const resetState = useCallback(() => setState('idle'), []);

  return {
    shouldSuggestCompaction,
    estimatedTokens,
    messageCount: messages.length,
    compactionState: state,
    compact,
    dismiss,
    resetState,
  };
}
