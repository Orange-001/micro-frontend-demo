import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Theme, CodeTheme } from '../types/chat';
import { storageService } from '../services/storageService';
import { getDefaultCodeTheme } from '../constants/codeThemes';

interface UIState {
  sidebarCollapsed: boolean;
  settingsDrawerOpen: boolean;
  theme: Theme;
  codeTheme: CodeTheme;
  selectedModel: string;
  searchQuery: string;
  webSearchEnabled: boolean;
  deepThinkingEnabled: boolean;
}

const savedUI = storageService.loadUI<Partial<UIState>>();

const initialState: UIState = {
  sidebarCollapsed: savedUI?.sidebarCollapsed ?? false,
  settingsDrawerOpen: false,
  theme: savedUI?.theme ?? 'dark',
  codeTheme: savedUI?.codeTheme ?? 'github-dark',
  selectedModel: savedUI?.selectedModel ?? '',
  searchQuery: '',
  webSearchEnabled: false,
  deepThinkingEnabled: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    loadFromStorage(state, action: PayloadAction<Partial<UIState>>) {
      Object.assign(state, action.payload);
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setSettingsDrawerOpen(state, action: PayloadAction<boolean>) {
      state.settingsDrawerOpen = action.payload;
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      state.codeTheme = getDefaultCodeTheme(action.payload);
    },
    toggleTheme(state) {
      const next = state.theme === 'light' ? 'dark' : 'light';
      state.theme = next;
      state.codeTheme = getDefaultCodeTheme(next);
    },
    setCodeTheme(state, action: PayloadAction<CodeTheme>) {
      state.codeTheme = action.payload;
    },
    setSelectedModel(state, action: PayloadAction<string>) {
      state.selectedModel = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    toggleWebSearch(state) {
      state.webSearchEnabled = !state.webSearchEnabled;
    },
    toggleDeepThinking(state) {
      state.deepThinkingEnabled = !state.deepThinkingEnabled;
    },
  },
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
