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
