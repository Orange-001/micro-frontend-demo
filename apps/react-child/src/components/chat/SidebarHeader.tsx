import { Button, Tooltip } from 'antd';
import { PlusOutlined, MenuFoldOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  gap: 8px;
`;

const Logo = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface Props {
  onNewChat: () => void;
  onToggle: () => void;
}

export function SidebarHeader({ onNewChat, onToggle }: Props) {
  return (
    <Header>
      <Tooltip title="折叠侧边栏">
        <Button type="text" icon={<MenuFoldOutlined />} onClick={onToggle} size="small" />
      </Tooltip>
      <Logo>ChatGPT</Logo>
      <Tooltip title="新建对话">
        <Button type="text" icon={<PlusOutlined />} onClick={onNewChat} size="small" />
      </Tooltip>
    </Header>
  );
}
