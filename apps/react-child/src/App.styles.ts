import styled from 'styled-components';

export const Wrapper = styled.div`
  /* padding: 16px; */

  .card {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 16px;
    color: rgba(255, 255, 255, 0.92);
  }

  .head {
    margin: 0;
  }

  .head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .brand {
    font-weight: 700;
  }

  .nav-links {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .nav-link {
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .counter-card {
    margin-top: 12px;
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
  }

  .content {
    margin-top: 12px;
    padding: 0 2px 14px;
  }
`;
