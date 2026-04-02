/**
 * INTERVIEW TOPIC: 三面1 - ChatGPT Web 客户端架构分层
 *
 * 架构分层：types → utils → services → store → hooks → components → views
 * ChatLayout 作为顶层布局组件，组合 Sidebar 和 MainArea
 * 使用 CSS Flexbox 实现侧边栏 + 主区域的经典双栏布局
 */

import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useLocalStorageSync } from '../../hooks/useLocalStorageSync';
import { Sidebar } from './Sidebar';
import { MainArea } from './MainArea';
import { Wrapper } from './ChatLayout.styles';

export function ChatLayout() {
  const sidebarCollapsed = useSelector((s: RootState) => s.ui.sidebarCollapsed);
  const theme = useSelector((s: RootState) => s.ui.theme);

  // 持久化 Redux 到 LocalStorage
  useLocalStorageSync();

  return (
    <Wrapper $collapsed={sidebarCollapsed} $theme={theme}>
      <Sidebar />
      <MainArea />
    </Wrapper>
  );
}
