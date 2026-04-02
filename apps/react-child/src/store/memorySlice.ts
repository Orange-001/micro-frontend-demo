import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MemoryItem } from '../types/chat';

interface MemoryState {
  items: MemoryItem[];
  globalEnabled: boolean;
}

const initialState: MemoryState = {
  items: [],
  globalEnabled: true,
};

let memIdCounter = 0;

const memorySlice = createSlice({
  name: 'memory',
  initialState,
  reducers: {
    loadFromStorage(_, action: PayloadAction<MemoryState>) {
      return action.payload;
    },
    addItem(state, action: PayloadAction<string>) {
      const now = Date.now();
      state.items.push({
        id: `mem-${now}-${++memIdCounter}`,
        content: action.payload,
        createdAt: now,
        updatedAt: now,
        enabled: true,
      });
    },
    updateItem(state, action: PayloadAction<{ id: string; content: string }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.content = action.payload.content;
        item.updatedAt = Date.now();
      }
    },
    deleteItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    toggleItem(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.enabled = !item.enabled;
    },
    setGlobalEnabled(state, action: PayloadAction<boolean>) {
      state.globalEnabled = action.payload;
    },
  },
});

export const memoryActions = memorySlice.actions;
export const memoryReducer = memorySlice.reducer;
