import styled from 'styled-components';

export const Wrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
  scroll-behavior: smooth;
`;

export const MessagesContainer = styled.div`
  max-width: 768px;
  margin: 0 auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
