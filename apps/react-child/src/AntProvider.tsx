import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  microContainer: HTMLElement;
};

export function AntProvider({ children, microContainer }: Props) {
  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider
        getPopupContainer={() => microContainer}
        theme={{
          token: {
            // 子应用主色：用于验证 host 与 react-child 主题隔离
            colorPrimary: '#ff4d4f',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
