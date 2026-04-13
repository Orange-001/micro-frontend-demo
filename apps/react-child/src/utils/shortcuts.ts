/**
 * 快捷键配置工具
 * 支持用户自定义键盘快捷键绑定
 */

/** 支持的快捷键动作 ID */
export type ShortcutActionId =
  | 'newChat'
  | 'focusInput'
  | 'focusSearch'
  | 'toggleSidebar';

/** 快捷键配置：动作 ID -> 键组合字符串 */
export type ShortcutsConfig = Record<ShortcutActionId, string>;

/** 快捷键动作描述 */
export const SHORTCUT_LABELS: Record<ShortcutActionId, string> = {
  newChat: '新建对话',
  focusInput: '聚焦输入框',
  focusSearch: '聚焦搜索',
  toggleSidebar: '切换侧边栏',
};

/** 默认快捷键配置 */
export const DEFAULT_SHORTCUTS: ShortcutsConfig = {
  newChat: 'Cmd+Shift+N',
  focusInput: 'Cmd+/',
  focusSearch: 'Cmd+K',
  toggleSidebar: 'Cmd+B',
};

/**
 * 将 KeyboardEvent 解析为标准化的键组合字符串
 * 格式: "Cmd+Shift+K" / "Ctrl+/" / "Alt+Shift+N"
 */
export function eventToKeys(e: KeyboardEvent): string {
  const parts: string[] = [];

  if (e.metaKey) parts.push('Cmd');
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  const key = normalizeKey(e.key);
  if (key) parts.push(key);

  // 如果只有修饰键（没有实际键），返回空
  if (parts.length === 0 || (parts.length === 1 && ['Cmd', 'Ctrl', 'Alt', 'Shift'].includes(parts[0]))) {
    return '';
  }

  return parts.join('+');
}

/** 规范化键名 */
function normalizeKey(key: string): string {
  const map: Record<string, string> = {
    ' ': 'Space',
    Escape: '', // Escape 不允许单独绑定
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  };
  if (map[key] !== undefined) return map[key];
  if (key.length === 1) return key.toUpperCase();
  return key;
}

/**
 * 判断当前按键是否匹配给定的键组合
 */
export function matchesKeys(e: KeyboardEvent, keys: string): boolean {
  const eventKeys = eventToKeys(e);
  return eventKeys === keys;
}

/**
 * 渲染快捷键显示标签（跨平台适配）
 */
export function renderShortcutKeys(keys: string): string {
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  return keys
    .replace('Cmd', isMac ? '⌘' : 'Ctrl')
    .replace('Ctrl', 'Ctrl')
    .replace('Shift', '⇧')
    .replace('Alt', isMac ? '⌥' : 'Alt');
}
