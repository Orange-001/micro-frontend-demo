import styled from 'styled-components';

export const Wrapper = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;

  .brand {
    font-weight: 700;
  }

  .nav-links {
    display: flex;
    gap: 12px;
  }

  .nav-link {
    color: #fff;
    opacity: 0.85;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    &.active {
      opacity: 1;
    }
  }
`;
