import styled from 'styled-components';

export const CodeBlockWrapper = styled.div`
  position: relative;
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
`;

export const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
`;

export const CopyBtn = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
`;

export const Pre = styled.pre`
  margin: 0;
  overflow-x: auto;

  code {
    display: block;
    padding: 16px;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.6;
  }
`;
