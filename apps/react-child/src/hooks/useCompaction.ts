import { useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

export function useCompaction() {
  const dispatch = useDispatch<AppDispatch>();
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const config = useSelector((s: RootState) => s.config);
  const messages = activeId ? (conversations[activeId]?.messages ?? []) : [];
  const [isCompacting, setIsCompacting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const estimatedTokens = useMemo(() => estimateConversationTokens(messages), [messages]);

  const shouldSuggestCompaction =
    !dismissed &&
    !isCompacting &&
    (messages.length > COMPACT_MESSAGE_THRESHOLD || estimatedTokens > COMPACT_TOKEN_THRESHOLD);

  const compact = useCallback(async () => {
    if (!activeId) return;
    setIsCompacting(true);

    try {
      const { toCompact, toKeep } = getCompactionCandidates(messages);
      if (toCompact.length === 0) return;

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
    } catch (err) {
      console.error('Compaction failed:', err);
    } finally {
      setIsCompacting(false);
    }
  }, [activeId, messages, config, dispatch]);

  const dismiss = useCallback(() => setDismissed(true), []);

  return {
    shouldSuggestCompaction,
    estimatedTokens,
    messageCount: messages.length,
    isCompacting,
    compact,
    dismiss,
  };
}
