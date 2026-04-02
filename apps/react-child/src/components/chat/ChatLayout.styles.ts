import styled from 'styled-components';

export const Wrapper = styled.div<{ $collapsed: boolean; $theme: string }>`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: ${(p) => (p.$theme === 'dark' ? '#212121' : '#ffffff')};
  color: ${(p) => (p.$theme === 'dark' ? '#ececec' : '#0d0d0d')};
  position: relative;

  --sidebar-width: ${(p) => (p.$collapsed ? '0px' : '260px')};
  --bg-primary: ${(p) => (p.$theme === 'dark' ? '#212121' : '#ffffff')};
  --bg-secondary: ${(p) => (p.$theme === 'dark' ? '#171717' : '#f9f9f9')};
  --bg-sidebar: ${(p) => (p.$theme === 'dark' ? '#171717' : '#f9f9f9')};
  --bg-hover: ${(p) => (p.$theme === 'dark' ? '#2f2f2f' : '#ececec')};
  --bg-input: ${(p) => (p.$theme === 'dark' ? '#2f2f2f' : '#f4f4f4')};
  --text-primary: ${(p) => (p.$theme === 'dark' ? '#ececec' : '#0d0d0d')};
  --text-secondary: ${(p) => (p.$theme === 'dark' ? '#b4b4b4' : '#666666')};
  --text-tertiary: ${(p) => (p.$theme === 'dark' ? '#8e8e8e' : '#999999')};
  --border-color: ${(p) => (p.$theme === 'dark' ? '#2f2f2f' : '#e5e5e5')};
  --accent-color: #10a37f;
  --accent-hover: #0d8a6c;
  --code-bg: ${(p) => (p.$theme === 'dark' ? '#1e1e1e' : '#f6f8fa')};
  --scrollbar-thumb: ${(p) => (p.$theme === 'dark' ? '#565656' : '#c5c5c5')};

  /* 全局滚动条 */
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) transparent;
  }

  *::-webkit-scrollbar {
    width: 6px;
  }
  *::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }
  *::-webkit-scrollbar-track {
    background: transparent;
  }

  transition: background 0.3s, color 0.3s;

  @media (max-width: 768px) {
    --sidebar-width: 0px;
  }
`;
