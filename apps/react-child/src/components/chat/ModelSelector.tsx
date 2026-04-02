import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Select } from 'antd';
import type { RootState } from '../../store';
import { uiActions } from '../../store/uiSlice';
import { PROVIDER_PRESETS } from '../../constants/providers';

export function ModelSelector() {
  const dispatch = useDispatch();
  const selected = useSelector((s: RootState) => s.ui.selectedModel);
  const config = useSelector((s: RootState) => s.config);

  const preset = PROVIDER_PRESETS[config.provider];
  const modelOptions = preset.models.map((m) => ({
    value: m.id,
    label: m.name,
  }));

  // 当 provider 切换后，若已选模型不在当前列表中，自动纠正为第一个可用模型
  useEffect(() => {
    if (config.provider === 'custom') return;
    const valid = modelOptions.some((o) => o.value === selected);
    if (!valid && modelOptions[0]) {
      dispatch(uiActions.setSelectedModel(modelOptions[0].value));
    }
  }, [config.provider]); // eslint-disable-line react-hooks/exhaustive-deps

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
        placeholder="输入模型 ID"
        maxCount={1}
      />
    );
  }

  return (
    <Select
      value={selected}
      onChange={(val) => dispatch(uiActions.setSelectedModel(val))}
      variant="borderless"
      style={{ minWidth: 160 }}
      options={modelOptions}
    />
  );
}
