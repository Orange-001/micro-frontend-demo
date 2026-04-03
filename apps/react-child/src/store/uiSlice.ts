import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Theme } from '../types/chat';
import { storageService } from '../services/storageService';
import { PROVIDER_PRESETS } from '../constants/providers';

interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  selectedModel: string;
  searchQuery: string;
  webSearchEnabled: boolean;
  deepThinkingEnabled: boolean;
}

const savedUI = storageService.loadUI<Partial<UIState>>();

const initialState: UIState = {
  sidebarCollapsed: savedUI?.sidebarCollapsed ?? false,
  theme: savedUI?.theme ?? 'light',
  selectedModel: savedUI?.selectedModel ?? PROVIDER_PRESETS.openrouter.models[0].id,
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
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
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
