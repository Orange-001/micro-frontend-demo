import styled from 'styled-components';

export const Wrapper = styled.section`
  background: var(--mfe-bg-card);
  border: 1px solid var(--mfe-border-subtle);
  border-radius: var(--mfe-radius-lg);
  padding: var(--mfe-space-lg);

  .title {
    margin-top: 0;
    color: var(--mfe-text-strong);
  }

  .text {
    margin-bottom: 0;
    color: var(--mfe-text-secondary);
    line-height: 1.7;
  }
`;
