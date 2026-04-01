import styled from 'styled-components';

interface WrapperProps {
  /** counter 是否达到高亮阈值 */
  $highlight: boolean;
}

export const Wrapper = styled.div<WrapperProps>`
  max-width: 1100px;
  margin: 24px auto;
  padding: 16px;

  .spacer {
    height: 16px;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 16px;
  }

  .card-title {
    margin-top: 0;
  }

  .counter-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .counter-value {
    font-size: 18px;
    color: ${({ $highlight }) => ($highlight ? '#f5222d' : 'inherit')};
    font-weight: ${({ $highlight }) => ($highlight ? 700 : 400)};
    transition:
      color 0.3s,
      font-weight 0.3s;
  }

  .micro-viewport {
    min-height: 420px;
    padding: 0;
    overflow: hidden;
    background: transparent;
    border: none;
    border-radius: 0;
  }

  .placeholder {
    padding: 16px;
    opacity: 0.7;
  }
`;
