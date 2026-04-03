import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { CODE_THEME_MAP } from '../../constants/codeThemes';

/**
 * 动态注入 highlight.js 主题 CSS
 * 通过 <style> 标签将当前选中的代码主题样式注入页面
 */
export function CodeThemeStyle() {
  const codeTheme = useSelector((s: RootState) => s.ui.codeTheme);

  const css = useMemo(() => {
    const config = CODE_THEME_MAP[codeTheme];
    return config?.css ?? '';
  }, [codeTheme]);

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
