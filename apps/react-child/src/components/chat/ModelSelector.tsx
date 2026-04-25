import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { RootState } from '../../store';
import { uiActions } from '../../store/uiSlice';
import { configActions } from '../../store/configSlice';
import { fetchModels } from '../../services/modelFetcher';

export function ModelSelector() {
  const dispatch = useDispatch();
  const selected = useSelector((s: RootState) => s.ui.selectedModel);
  const config = useSelector((s: RootState) => s.config);
  const [localLoading, setLocalLoading] = useState(false);

  const modelOptions =
    config.provider === 'custom'
      ? []
      : config.fetchedModels.map((m) => ({
          value: m.id,
          label: m.name,
        }));
  const isMissingApiConfig = !config.baseUrl.trim() || !config.apiKey.trim();
  const placeholder = isMissingApiConfig ? '请先配置 API' : '请选择模型';

  const fetchModelsIfNeeded = useCallback(async () => {
    if (config.provider === 'custom' || !config.apiKey) return;
    if (config.fetchedModels.length > 0) return;

    setLocalLoading(true);
    try {
      const models = await fetchModels(config.baseUrl, config.apiKey, config.provider);
      dispatch(configActions.setFetchedModels(models));
      if (!selected && models.length > 0) {
        dispatch(uiActions.setSelectedModel(models[0].id));
      }
    } catch {
      // silently fail
    } finally {
      setLocalLoading(false);
    }
  }, [
    config.provider,
    config.baseUrl,
    config.apiKey,
    config.fetchedModels.length,
    selected,
    dispatch,
  ]);

  useEffect(() => {
    fetchModelsIfNeeded();
  }, [fetchModelsIfNeeded]);

  // When selected model is not in fetched list, pick first
  useEffect(() => {
    if (config.provider === 'custom' || modelOptions.length === 0) return;
    const valid = modelOptions.some((o) => o.value === selected);
    if (!valid && modelOptions[0]) {
      dispatch(uiActions.setSelectedModel(modelOptions[0].value));
    }
  }, [config.provider, selected, modelOptions, dispatch]);

  if (config.provider === 'custom') {
    return (
      <Select
        mode="tags"
        value={selected ? [selected] : []}
        onChange={(vals) => {
          const val = vals[vals.length - 1];
          if (val) dispatch(uiActions.setSelectedModel(val));
        }}
        variant="borderless"
        style={{ minWidth: 160 }}
        placeholder={isMissingApiConfig ? '请先配置 API' : '输入模型 ID'}
        maxCount={1}
      />
    );
  }

  const loading = localLoading || config.isLoadingModels;

  return (
    <Select
      showSearch
      optionFilterProp="label"
      value={selected || undefined}
      onChange={(val) => dispatch(uiActions.setSelectedModel(val))}
      variant="borderless"
      style={{ minWidth: 160 }}
      placeholder={placeholder}
      options={modelOptions}
      loading={loading}
      suffixIcon={loading ? <LoadingOutlined spin /> : undefined}
    />
  );
}
