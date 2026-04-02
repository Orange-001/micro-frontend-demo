import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, theme as antTheme } from 'antd';
import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

type Props = {
  children: ReactNode;
  microContainer: HTMLElement;
};

export function AntProvider({ children, microContainer }: Props) {
  const currentTheme = useSelector((s: RootState) => s.ui.theme);

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider
        getPopupContainer={() => microContainer}
        theme={{
          algorithm: currentTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#10a37f',
            borderRadius: 8,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
