import githubDark from 'highlight.js/styles/github-dark.css?raw';
import githubLight from 'highlight.js/styles/github.css?raw';
import vs2015 from 'highlight.js/styles/vs2015.css?raw';
import atomOneDark from 'highlight.js/styles/atom-one-dark.css?raw';
import monokaiSublime from 'highlight.js/styles/monokai-sublime.css?raw';
import tokyoNightDark from 'highlight.js/styles/tokyo-night-dark.css?raw';

import type { CodeTheme } from '../types/chat';

export interface CodeThemeConfig {
  id: CodeTheme;
  name: string;
  style: 'light' | 'dark';
  css: string;
}

export const CODE_THEMES: CodeThemeConfig[] = [
  { id: 'github-dark', name: 'GitHub Dark', style: 'dark', css: githubDark },
  { id: 'github-light', name: 'GitHub Light', style: 'light', css: githubLight },
  { id: 'vs2015', name: 'VS 2015', style: 'dark', css: vs2015 },
  { id: 'atom-one-dark', name: 'Atom One Dark', style: 'dark', css: atomOneDark },
  { id: 'monokai-sublime', name: 'Monokai Sublime', style: 'dark', css: monokaiSublime },
  { id: 'tokyo-night-dark', name: 'Tokyo Night', style: 'dark', css: tokyoNightDark },
];

export const CODE_THEME_MAP = Object.fromEntries(CODE_THEMES.map((t) => [t.id, t])) as Record<
  CodeTheme,
  CodeThemeConfig
>;

/** 根据应用主题返回默认代码主题 */
export function getDefaultCodeTheme(appTheme: 'light' | 'dark'): CodeTheme {
  return appTheme === 'light' ? 'github-light' : 'github-dark';
}
