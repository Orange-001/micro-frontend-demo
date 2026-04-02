import styled from 'styled-components';

export const Wrapper = styled.aside<{ $collapsed: boolean }>`
  width: 260px;
  height: 100%;
  background: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  transform: translateX(${(p) => (p.$collapsed ? '-260px' : '0')});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;
  border-right: 1px solid var(--border-color);

  @media (min-width: 769px) {
    position: relative;
    margin-left: ${(p) => (p.$collapsed ? '-260px' : '0')};
  }
`;

export const SidebarOverlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9;
  }
`;
