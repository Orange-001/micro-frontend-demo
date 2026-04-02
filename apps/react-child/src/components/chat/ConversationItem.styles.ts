import styled from 'styled-components';

export const ItemWrapper = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  background: ${(p) => (p.$active ? 'var(--bg-hover)' : 'transparent')};
  transition: background 0.15s;
  gap: 8px;
  position: relative;
  group: '';

  &:hover {
    background: var(--bg-hover);
  }

  .actions {
    display: none;
    gap: 2px;
  }

  &:hover .actions {
    display: flex;
  }
`;

export const Title = styled.div`
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RenameInput = styled.input`
  flex: 1;
  font-size: 14px;
  background: var(--bg-input);
  border: 1px solid var(--accent-color);
  border-radius: 4px;
  padding: 2px 6px;
  color: var(--text-primary);
  outline: none;
`;
