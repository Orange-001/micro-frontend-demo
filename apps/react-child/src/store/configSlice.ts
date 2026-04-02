import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { APIConfig, APIProvider } from '../types/chat';
import { PROVIDER_PRESETS } from '../constants/providers';

const initialState: APIConfig = {
  provider: 'openrouter',
  baseUrl: PROVIDER_PRESETS.openrouter.baseUrl,
  apiKey: '',
  defaultModel: PROVIDER_PRESETS.openrouter.models[0].id,
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    loadFromStorage(_, action: PayloadAction<APIConfig>) {
      return action.payload;
    },
    setProvider(state, action: PayloadAction<APIProvider>) {
      const preset = PROVIDER_PRESETS[action.payload];
      state.provider = action.payload;
      state.baseUrl = preset.baseUrl;
      state.defaultModel = preset.models[0]?.id ?? '';
    },
    setBaseUrl(state, action: PayloadAction<string>) {
      state.baseUrl = action.payload;
    },
    setApiKey(state, action: PayloadAction<string>) {
      state.apiKey = action.payload;
    },
    setDefaultModel(state, action: PayloadAction<string>) {
      state.defaultModel = action.payload;
    },
    setTemperature(state, action: PayloadAction<number>) {
      state.temperature = action.payload;
    },
    setMaxTokens(state, action: PayloadAction<number>) {
      state.maxTokens = action.payload;
    },
    setTopP(state, action: PayloadAction<number>) {
      state.topP = action.payload;
    },
    resetToDefaults() {
      return initialState;
    },
  },
});

export const configActions = configSlice.actions;
export const configReducer = configSlice.reducer;
