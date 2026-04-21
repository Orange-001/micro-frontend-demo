/**
 * INTERVIEW TOPIC: 二面4 - React Fiber + useTransition
 *
 * useTransition 让搜索过滤成为"非紧急更新"：
 * - 输入框的值更新是高优先级（用户看到即时反馈）
 * - 过滤列表的渲染是低优先级（可以被中断、延迟执行）
 * - React Fiber 的时间切片调度器会优先处理高优先级任务
 * - 如果在低优先级任务执行中又有新的输入，Fiber 会中断当前渲染
 */

import { useCallback, useMemo, useTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { uiActions } from '../../store/uiSlice';
import { chatActions } from '../../store/chatSlice';
import { SidebarHeader } from './SidebarHeader';
import { ConversationList } from './ConversationList';
import { UserProfile } from './UserProfile';
import { groupConversationsByDate } from '../../utils/dateGrouping';
import { Wrapper, SidebarOverlay } from './Sidebar.styles';

export function Sidebar() {
  const dispatch = useDispatch<AppDispatch>();
  const collapsed = useSelector((s: RootState) => s.ui.sidebarCollapsed);
  const searchQuery = useSelector((s: RootState) => s.ui.searchQuery);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const conversationOrder = useSelector((s: RootState) => s.chat.conversationOrder);
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);

  // INTERVIEW: 二面4 - useTransition 标记过滤为低优先级
  const [isPending] = useTransition();

  const handleSearch = useCallback(
    (value: string) => {
      // 直接更新搜索框（高优先级）
      dispatch(uiActions.setSearchQuery(value));
    },
    [dispatch],
  );

  // 过滤并分组的会话列表
  const groupedConversations = useMemo(() => {
    const summaries = conversationOrder.map((id) => {
      const c = conversations[id];
      return { id: c.id, title: c.title, updatedAt: c.updatedAt, model: c.model };
    });

    const filtered = searchQuery
      ? summaries.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : summaries;

    return groupConversationsByDate(filtered);
  }, [conversations, conversationOrder, searchQuery]);

  const handleNewChat = useCallback(() => {
    dispatch(chatActions.createConversation({ model: selectedModel }));
  }, [dispatch, selectedModel]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      dispatch(chatActions.setActiveConversation(id));
      // 移动端选择后自动关闭侧边栏
      if (window.innerWidth <= 768) {
        dispatch(uiActions.setSidebarCollapsed(true));
      }
    },
    [dispatch],
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      dispatch(chatActions.deleteConversation(id));
    },
    [dispatch],
  );

  const handleRenameConversation = useCallback(
    (id: string, title: string) => {
      dispatch(chatActions.renameConversation({ id, title }));
    },
    [dispatch],
  );

  return (
    <>
      {!collapsed && <SidebarOverlay onClick={() => dispatch(uiActions.toggleSidebar())} />}
      <Wrapper $collapsed={collapsed}>
        <SidebarHeader
          onNewChat={handleNewChat}
          onToggle={() => dispatch(uiActions.toggleSidebar())}
        />
        <ConversationList
          groups={groupedConversations}
          activeId={activeId}
          isPending={isPending}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          onRename={handleRenameConversation}
        />
        <UserProfile />
      </Wrapper>
    </>
  );
}
