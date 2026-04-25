import { useCallback } from 'react';
import { App } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { uiActions } from '../store/uiSlice';

export function useChatConfigGuard() {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((s: RootState) => s.config);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);
  const { modal } = App.useApp();

  return useCallback(() => {
    const missingItems = [
      !config.baseUrl.trim() ? 'API Base URL' : null,
      !config.apiKey.trim() ? 'API Key' : null,
      !selectedModel.trim() ? '模型' : null,
    ].filter(Boolean);

    if (missingItems.length === 0) return true;

    modal.confirm({
      title: '需要先完成 API 配置',
      content: `缺少 ${missingItems.join('、')}。是否前往配置？`,
      okText: '前往配置',
      cancelText: '取消',
      onOk: () => {
        dispatch(uiActions.setSettingsDrawerOpen(true));
      },
    });

    return false;
  }, [config.apiKey, config.baseUrl, dispatch, modal, selectedModel]);
}
