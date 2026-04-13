import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { APIConfig, APIProvider } from '../types/chat';
import { PROVIDER_PRESETS } from '../constants/providers';
import { DEFAULT_SHORTCUTS, type ShortcutsConfig, type ShortcutActionId } from '../utils/shortcuts';

interface ModelOption {
  id: string;
  name: string;
  description: string;
}

interface ConfigState extends Omit<APIConfig, 'searchBaseUrl'> {
  searchBaseUrl: string;
  fetchedModels: ModelOption[];
  isLoadingModels: boolean;
  shortcuts: ShortcutsConfig;
}

const initialState: ConfigState = {
  provider: 'openrouter',
  baseUrl: PROVIDER_PRESETS.openrouter.baseUrl,
  apiKey: '',
  defaultModel: '',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  searchBaseUrl: '',
  fetchedModels: [],
  isLoadingModels: false,
  shortcuts: DEFAULT_SHORTCUTS,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    loadFromStorage(state, action: PayloadAction<Partial<APIConfig> & { shortcuts?: ShortcutsConfig }>) {
      if (action.payload.provider) state.provider = action.payload.provider;
      if (action.payload.baseUrl) state.baseUrl = action.payload.baseUrl;
      if (action.payload.apiKey) state.apiKey = action.payload.apiKey;
      if (action.payload.defaultModel) state.defaultModel = action.payload.defaultModel;
      if (action.payload.temperature !== undefined) state.temperature = action.payload.temperature;
      if (action.payload.maxTokens) state.maxTokens = action.payload.maxTokens;
      if (action.payload.topP !== undefined) state.topP = action.payload.topP;
      // Merge shortcuts if present, filling in defaults for missing keys
      if (action.payload.shortcuts) {
        state.shortcuts = { ...DEFAULT_SHORTCUTS, ...action.payload.shortcuts };
      }
    },
    setProvider(state, action: PayloadAction<APIProvider>) {
      const preset = PROVIDER_PRESETS[action.payload];
      state.provider = action.payload;
      state.baseUrl = preset.baseUrl;
      state.defaultModel = '';
      // Clear fetched models so they'll be re-fetched for the new provider
      state.fetchedModels = [];
    },
    setBaseUrl(state, action: PayloadAction<string>) {
      state.baseUrl = action.payload;
      // Clear fetched models when base URL changes
      state.fetchedModels = [];
    },
    setApiKey(state, action: PayloadAction<string>) {
      state.apiKey = action.payload;
      // Clear fetched models so they'll be re-fetched with the new key
      state.fetchedModels = [];
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
    setSearchBaseUrl(state, action: PayloadAction<string>) {
      state.searchBaseUrl = action.payload;
    },
    setFetchedModels(state, action: PayloadAction<ModelOption[]>) {
      state.fetchedModels = action.payload;
    },
    setLoadingModels(state, action: PayloadAction<boolean>) {
      state.isLoadingModels = action.payload;
    },
    setShortcut(state, action: PayloadAction<{ actionId: ShortcutActionId; keys: string }>) {
      state.shortcuts[action.payload.actionId] = action.payload.keys;
    },
    resetShortcut(state, action: PayloadAction<ShortcutActionId>) {
      state.shortcuts[action.payload] = DEFAULT_SHORTCUTS[action.payload];
    },
    resetAllShortcuts(state) {
      state.shortcuts = { ...DEFAULT_SHORTCUTS };
    },
    resetToDefaults() {
      return initialState;
    },
  },
});

export const configActions = configSlice.actions;
export const configReducer = configSlice.reducer;
