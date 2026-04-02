import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Theme } from '../types/chat';

interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  selectedModel: string;
  searchQuery: string;
  webSearchEnabled: boolean;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'light',
  selectedModel: 'gpt-4o',
  searchQuery: '',
  webSearchEnabled: false,
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
  },
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
