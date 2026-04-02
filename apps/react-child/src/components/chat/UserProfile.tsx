import { Avatar } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';
import { ThemeToggle } from '../common/ThemeToggle';
import styled from 'styled-components';

const ProfileWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 10px;
  border-top: 1px solid var(--border-color);
`;

const UserName = styled.span`
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function UserProfile() {
  return (
    <ProfileWrapper>
      <Avatar size={28} icon={<UserOutlined />} style={{ background: 'var(--accent-color)' }} />
      <UserName>User</UserName>
      <ThemeToggle />
    </ProfileWrapper>
  );
}
