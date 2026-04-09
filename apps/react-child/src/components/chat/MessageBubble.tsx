import { memo } from 'react';
import type { Message } from '../../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageActions } from './MessageActions';
import { FileOutlined } from '@ant-design/icons';
import {
  BubbleWrapper,
  AvatarWrapper,
  ContentWrapper,
  StreamingCursor,
  ActionsRow,
  AttachmentGrid,
  AttachmentImage,
  AttachmentFile,
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
          <>
            {message.attachments && message.attachments.length > 0 && (
              <AttachmentGrid>
                {message.attachments.map((att) =>
                  att.type?.startsWith('image/') ? (
                    <AttachmentImage
                      key={att.id}
                      src={att.url}
                      alt={att.name}
                      onClick={() => window.open(att.url, '_blank')}
                    />
                  ) : (
                    <AttachmentFile key={att.id}>
                      <FileOutlined />
                      <span>{att.name}</span>
                    </AttachmentFile>
                  ),
                )}
              </AttachmentGrid>
            )}
            <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
          </>
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
