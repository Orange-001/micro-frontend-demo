import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Tooltip, message } from 'antd';
import {
  CopyOutlined,
  ReloadOutlined,
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
} from '@ant-design/icons';
import type { Message } from '../../types/chat';
import { chatActions } from '../../store/chatSlice';
import { useStreamingResponse } from '../../hooks/useStreamingResponse';

interface Props {
  message: Message;
  conversationId: string;
}

export function MessageActions({ message: msg, conversationId }: Props) {
  const dispatch = useDispatch();
  const isAssistant = msg.role === 'assistant';
  const { regenerateMessage, isStreaming } = useStreamingResponse();

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(msg.content);
    message.success('已复制');
  }, [msg.content]);

  const handleRegenerate = useCallback(() => {
    regenerateMessage(conversationId, msg.id);
  }, [regenerateMessage, conversationId, msg.id]);

  const handleReaction = useCallback(
    (reaction: 'like' | 'dislike') => {
      dispatch(
        chatActions.toggleReaction({
          conversationId,
          messageId: msg.id,
          reaction,
        }),
      );
    },
    [dispatch, conversationId, msg.id],
  );

  return (
    <>
      <Tooltip title="复制">
        <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopy} />
      </Tooltip>
      {isAssistant && (
        <>
          <Tooltip title="重新生成">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleRegenerate}
              disabled={isStreaming}
            />
          </Tooltip>
          <Tooltip title="赞">
            <Button
              type="text"
              size="small"
              icon={
                msg.reaction === 'like' ? (
                  <LikeFilled style={{ color: 'var(--accent-color)' }} />
                ) : (
                  <LikeOutlined />
                )
              }
              onClick={() => handleReaction('like')}
            />
          </Tooltip>
          <Tooltip title="踩">
            <Button
              type="text"
              size="small"
              icon={
                msg.reaction === 'dislike' ? (
                  <DislikeFilled style={{ color: '#ff4d4f' }} />
                ) : (
                  <DislikeOutlined />
                )
              }
              onClick={() => handleReaction('dislike')}
            />
          </Tooltip>
        </>
      )}
    </>
  );
}
