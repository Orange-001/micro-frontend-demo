import { configureStore } from '@reduxjs/toolkit';
import { counterReducer } from './counterSlice';
import { chatReducer } from './chatSlice';
import { uiReducer } from './uiSlice';
import { configReducer } from './configSlice';
import { memoryReducer } from './memorySlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    chat: chatReducer,
    ui: uiReducer,
    config: configReducer,
    memory: memoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
