/**
 * INTERVIEW TOPIC: 一面5 - 防抖在搜索场景的应用
 *
 * 侧边栏搜索使用手写的 debounce 函数：
 * - 用户输入时不立即过滤，等停止输入 300ms 后才执行
 * - 减少不必要的列表重渲染
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import type { DateGroupedConversations } from '../../types/chat';
import { debounce } from '../../utils/debounce';
import { ConversationItem } from './ConversationItem';

const ListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
`;

const SearchWrapper = styled.div`
  padding: 0 12px 8px;
`;

const GroupLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  padding: 12px 12px 4px;
  text-transform: uppercase;
`;

const EmptyState = styled.div`
  text-align: center;
  color: var(--text-tertiary);
  padding: 24px 12px;
  font-size: 14px;
`;

interface Props {
  groups: DateGroupedConversations[];
  activeId: string | null;
  isPending: boolean;
  searchQuery: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function ConversationList({
  groups,
  activeId,
  isPending,
  searchQuery,
  onSearch,
  onSelect,
  onDelete,
  onRename,
}: Props) {
  // INTERVIEW: 一面5 - 使用手写防抖，300ms 延迟
  const debouncedSearch = useMemo(() => debounce(onSearch, 300), [onSearch]);

  // 组件卸载时取消防抖
  const debouncedRef = useRef(debouncedSearch);
  debouncedRef.current = debouncedSearch;
  useEffect(() => {
    return () => debouncedRef.current.cancel();
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch],
  );

  const totalCount = groups.reduce((sum, g) => sum + g.conversations.length, 0);

  return (
    <>
      <SearchWrapper>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
          placeholder="搜索对话..."
          allowClear
          size="small"
          defaultValue={searchQuery}
          onChange={handleSearchChange}
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}
        />
      </SearchWrapper>
      <ListWrapper style={{ opacity: isPending ? 0.7 : 1 }}>
        {totalCount === 0 ? (
          <EmptyState>{searchQuery ? '未找到匹配的对话' : '暂无对话'}</EmptyState>
        ) : (
          groups.map((group) => (
            <div key={group.group}>
              <GroupLabel>{group.group}</GroupLabel>
              {group.conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  id={conv.id}
                  title={conv.title}
                  active={conv.id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onRename={onRename}
                />
              ))}
            </div>
          ))
        )}
      </ListWrapper>
    </>
  );
}
