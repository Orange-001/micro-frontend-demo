import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  hashId: string;
  // 控制弹层挂载，避免微前端场景弹出框跑到错误容器
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
};

export function AntProvider({ children, hashId, getPopupContainer }: Props) {
  return (
    <StyleProvider hashId={hashId} hashPriority="high">
      <ConfigProvider
        getPopupContainer={
          getPopupContainer ??
          (() => {
            return document.body;
          })
        }
        theme={{
          token: {
            // Host 默认主色（用于验证不同子应用主题隔离）
            colorPrimary: '#1677ff'
          }
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}

