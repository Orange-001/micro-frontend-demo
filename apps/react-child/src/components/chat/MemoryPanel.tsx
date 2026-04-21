import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Drawer, Switch, List, Input, Button, Empty, Popconfirm, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { RootState } from '../../store';
import { memoryActions } from '../../store/memorySlice';
import { chatActions } from '../../store/chatSlice';
import styled from 'styled-components';

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ConvMemoryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
`;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MemoryPanel({ open, onClose }: Props) {
  const dispatch = useDispatch();
  const memory = useSelector((s: RootState) => s.memory);
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const activeConv = activeId ? conversations[activeId] : null;

  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    dispatch(memoryActions.addItem(trimmed));
    setNewContent('');
  };

  const handleStartEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditValue(content);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      dispatch(memoryActions.updateItem({ id: editingId, content: editValue.trim() }));
    }
    setEditingId(null);
  };

  return (
    <Drawer title="Memory" placement="right" width={400} open={open} onClose={onClose}>
      <HeaderRow>
        <span>全局 Memory</span>
        <Switch
          checked={memory.globalEnabled}
          onChange={(checked) => dispatch(memoryActions.setGlobalEnabled(checked))}
          size="small"
        />
      </HeaderRow>

      {activeConv && (
        <ConvMemoryRow>
          <span>当前对话 Memory</span>
          <Switch
            checked={activeConv.memoryEnabled ?? true}
            onChange={() => dispatch(chatActions.toggleConversationMemory(activeId!))}
            size="small"
          />
        </ConvMemoryRow>
      )}

      {memory.items.length === 0 ? (
        <Empty
          description="暂无记忆条目"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '40px 0' }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            添加用户偏好、信息等，AI 会在对话中参考这些记忆
          </Typography.Text>
        </Empty>
      ) : (
        <List
          size="small"
          dataSource={memory.items}
          renderItem={(item) => (
            <List.Item
              actions={
                editingId === item.id
                  ? [
                      <Button
                        key="save"
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={handleSaveEdit}
                      />,
                      <Button
                        key="cancel"
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => setEditingId(null)}
                      />,
                    ]
                  : [
                      <Switch
                        key="toggle"
                        size="small"
                        checked={item.enabled}
                        onChange={() => dispatch(memoryActions.toggleItem(item.id))}
                      />,
                      <Button
                        key="edit"
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleStartEdit(item.id, item.content)}
                      />,
                      <Popconfirm
                        key="delete"
                        title="删除此条目？"
                        onConfirm={() => dispatch(memoryActions.deleteItem(item.id))}
                        okText="删除"
                        cancelText="取消"
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>,
                    ]
              }
            >
              {editingId === item.id ? (
                <Input.TextArea
                  autoSize
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                  }}
                  style={{ flex: 1 }}
                />
              ) : (
                <span style={{ opacity: item.enabled ? 1 : 0.5 }}>{item.content}</span>
              )}
            </List.Item>
          )}
        />
      )}

      <div style={{ marginTop: 16 }}>
        <Input.Search
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onSearch={handleAdd}
          enterButton="添加"
          placeholder="输入记忆条目..."
        />
      </div>
    </Drawer>
  );
}
