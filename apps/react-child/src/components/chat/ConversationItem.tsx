import { useState, useRef, useEffect, memo } from 'react';
import { Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { ItemWrapper, Title, RenameInput } from './ConversationItem.styles';

interface Props {
  id: string;
  title: string;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export const ConversationItem = memo(function ConversationItem({
  id,
  title,
  active,
  onSelect,
  onDelete,
  onRename,
}: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus();
  }, [isRenaming]);

  const handleConfirmRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== title) {
      onRename(id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmRename();
    if (e.key === 'Escape') {
      setRenameValue(title);
      setIsRenaming(false);
    }
  };

  return (
    <ItemWrapper $active={active} onClick={() => !isRenaming && onSelect(id)}>
      {isRenaming ? (
        <>
          <RenameInput
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleConfirmRename();
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setRenameValue(title);
              setIsRenaming(false);
            }}
          />
        </>
      ) : (
        <>
          <Title>{title}</Title>
          <div className="actions">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setRenameValue(title);
                setIsRenaming(true);
              }}
            />
            <Popconfirm
              title="删除此对话？"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete(id);
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="删除"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </div>
        </>
      )}
    </ItemWrapper>
  );
});
