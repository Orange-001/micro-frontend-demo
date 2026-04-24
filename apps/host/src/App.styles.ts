import styled from 'styled-components';

interface WrapperProps {
  $highlight: boolean;
}

export const Wrapper = styled.div<WrapperProps>`
  max-width: 1100px;
  margin: 24px auto;
  padding: var(--mfe-space-lg);

  .mfe-shell__spacer {
    height: var(--mfe-space-lg);
  }

  .mfe-shell__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--mfe-space-md);
  }

  .mfe-card {
    background: var(--mfe-bg-card);
    border: 1px solid var(--mfe-border-subtle);
    border-radius: var(--mfe-radius-lg);
    padding: var(--mfe-space-lg);
  }

  .mfe-card__title {
    margin-top: 0;
  }

  .mfe-counter-row {
    display: flex;
    align-items: center;
    gap: var(--mfe-space-md);
  }

  .mfe-counter-value {
    font-size: 18px;
    color: ${({ $highlight }) => ($highlight ? 'var(--mfe-color-danger)' : 'inherit')};
    font-weight: ${({ $highlight }) => ($highlight ? 700 : 400)};
    transition:
      color 0.3s,
      font-weight 0.3s;
  }

  .mfe-viewport {
    min-height: 420px;
    overflow: hidden;
    background: transparent;
    border: 0;
    border-radius: 0;
  }

  .mfe-viewport__placeholder {
    padding: var(--mfe-space-lg);
    opacity: 0.7;
  }
`;
