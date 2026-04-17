import styled from 'styled-components';

export const Wrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
`;

export const MessagesContainer = styled.div`
  max-width: 768px;
  margin: 0 auto;
  width: 100%;
  position: relative;
`;

export const VirtualItem = styled.div<{ $offsetTop: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform: translateY(${(p) => p.$offsetTop}px);
  will-change: transform;
`;
