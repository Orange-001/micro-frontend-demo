import styled from 'styled-components';

export const Wrapper = styled.div`
  background: var(--mfe-bg-card);
  border: 1px solid var(--mfe-border-subtle);
  border-radius: var(--mfe-radius-lg);
  padding: var(--mfe-space-lg);
  display: flex;
  align-items: center;
  gap: var(--mfe-space-md);

  .brand {
    font-weight: 700;
    color: var(--mfe-text-strong);
  }

  .nav-links {
    display: flex;
    gap: var(--mfe-space-md);
    flex-wrap: wrap;
  }

  .nav-link {
    color: var(--mfe-text-primary);
    opacity: 0.85;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    &.active {
      color: var(--mfe-color-primary);
      opacity: 1;
    }
  }
`;
