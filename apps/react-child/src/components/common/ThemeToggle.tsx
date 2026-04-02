import { useDispatch, useSelector } from 'react-redux';
import { Button, Tooltip } from 'antd';
import type { RootState } from '../../store';
import { uiActions } from '../../store/uiSlice';

export function ThemeToggle() {
  const dispatch = useDispatch();
  const theme = useSelector((s: RootState) => s.ui.theme);

  return (
    <Tooltip title={theme === 'light' ? '切换暗色模式' : '切换亮色模式'}>
      <Button
        type="text"
        onClick={() => dispatch(uiActions.toggleTheme())}
        style={{ color: 'var(--text-secondary)', fontSize: 18 }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </Button>
    </Tooltip>
  );
}
