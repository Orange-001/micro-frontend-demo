import { memo } from 'react';
import type { Message } from '../../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageActions } from './MessageActions';
import {
  BubbleWrapper,
  AvatarWrapper,
  ContentWrapper,
  StreamingCursor,
  ActionsRow,
} from './MessageBubble.styles';

interface Props {
  message: Message;
  conversationId: string;
}

export const MessageBubble = memo(function MessageBubble({ message, conversationId }: Props) {
  const isUser = message.role === 'user';

  return (
    <BubbleWrapper $role={message.role}>
      <AvatarWrapper $role={message.role}>
        {isUser ? '👤' : '✨'}
      </AvatarWrapper>
      <ContentWrapper $role={message.role}>
        {isUser ? (
          <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
        ) : (
          <>
            <MarkdownRenderer content={message.content} />
            {message.isStreaming && <StreamingCursor />}
          </>
        )}
        {!message.isStreaming && (
          <ActionsRow>
            <MessageActions message={message} conversationId={conversationId} />
          </ActionsRow>
        )}
      </ContentWrapper>
    </BubbleWrapper>
  );
});
