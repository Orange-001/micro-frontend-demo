import { memo, useState, useCallback, useRef, useEffect } from 'react';
import type { Message } from '../../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageActions } from './MessageActions';
import { useStreamingResponse } from '../../hooks/useStreamingResponse';
import { FileOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import {
  BubbleWrapper,
  AvatarWrapper,
  ContentWrapper,
  StreamingCursor,
  ActionsRow,
  AttachmentGrid,
  AttachmentImage,
  AttachmentFile,
  EditContainer,
  EditTextarea,
  EditButtons,
} from './MessageBubble.styles';

interface Props {
  message: Message;
  conversationId: string;
}

export const MessageBubble = memo(function MessageBubble({ message, conversationId }: Props) {
  const isUser = message.role === 'user';
  const { editAndResendMessage } = useStreamingResponse();

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const handleEdit = useCallback(() => {
    setEditContent(message.content);
    setEditing(true);
  }, [message.content]);

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  const handleSave = useCallback(() => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setEditing(false);
    editAndResendMessage(conversationId, message.id, trimmed);
  }, [editContent, conversationId, message.id, editAndResendMessage]);

  if (editing && isUser) {
    return (
      <BubbleWrapper $role="user">
        <AvatarWrapper $role="user">👤</AvatarWrapper>
        <ContentWrapper $role="user">
          <EditContainer>
            <EditTextarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') handleCancel();
              }}
              rows={3}
            />
            <EditButtons>
              <button onClick={handleSave} title="保存并发送">
                <CheckOutlined /> 保存
              </button>
              <button onClick={handleCancel} title="取消">
                <CloseOutlined /> 取消
              </button>
            </EditButtons>
          </EditContainer>
        </ContentWrapper>
      </BubbleWrapper>
    );
  }

  return (
    <BubbleWrapper $role={message.role}>
      <AvatarWrapper $role={message.role}>{isUser ? '👤' : '✨'}</AvatarWrapper>
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
            {isUser && (
              <button className="edit-btn" onClick={handleEdit} title="编辑并重新发送">
                <EditOutlined />
              </button>
            )}
            <MessageActions message={message} conversationId={conversationId} />
          </ActionsRow>
        )}
      </ContentWrapper>
    </BubbleWrapper>
  );
});
