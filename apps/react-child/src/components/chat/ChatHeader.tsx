import { useDispatch, useSelector } from 'react-redux';
import { Button, Tooltip } from 'antd';
import { MenuUnfoldOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import type { RootState, AppDispatch } from '../../store';
import { uiActions } from '../../store/uiSlice';
import { chatActions } from '../../store/chatSlice';
import { exportAsMarkdown } from '../../utils/exportConversation';
import { ModelSelector } from './ModelSelector';

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  border-bottom: 1px solid var(--border-color);
  height: 48px;
  flex-shrink: 0;
`;

const Spacer = styled.div`
  flex: 1;
`;

export function ChatHeader() {
  const dispatch = useDispatch<AppDispatch>();
  const collapsed = useSelector((s: RootState) => s.ui.sidebarCollapsed);
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);
  const activeConv = activeId ? conversations[activeId] : null;

  return (
    <Header>
      {collapsed && (
        <Tooltip title="展开侧边栏">
          <Button
            type="text"
            icon={<MenuUnfoldOutlined />}
            onClick={() => dispatch(uiActions.toggleSidebar())}
            size="small"
          />
        </Tooltip>
      )}
      {collapsed && (
        <Tooltip title="新建对话">
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => dispatch(chatActions.createConversation({ model: selectedModel }))}
            size="small"
          />
        </Tooltip>
      )}
      <ModelSelector />
      <Spacer />
      {activeConv && activeConv.messages.length > 0 && (
        <Tooltip title="导出对话">
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => exportAsMarkdown(activeConv)}
            size="small"
          />
        </Tooltip>
      )}
    </Header>
  );
}
