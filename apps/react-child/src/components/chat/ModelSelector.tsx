import { useDispatch, useSelector } from 'react-redux';
import { Select } from 'antd';
import type { RootState } from '../../store';
import { uiActions } from '../../store/uiSlice';
import type { ModelOption } from '../../types/chat';

const MODELS: ModelOption[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: '最强大的模型' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', description: '快速且经济' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5', description: '经典模型' },
];

export function ModelSelector() {
  const dispatch = useDispatch();
  const selected = useSelector((s: RootState) => s.ui.selectedModel);

  return (
    <Select
      value={selected}
      onChange={(val) => dispatch(uiActions.setSelectedModel(val))}
      variant="borderless"
      style={{ minWidth: 140 }}
      options={MODELS.map((m) => ({
        value: m.id,
        label: m.name,
      }))}
    />
  );
}
