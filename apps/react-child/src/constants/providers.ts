import type { APIProvider, ProviderPreset } from '../types/chat';

export const PROVIDER_PRESETS: Record<APIProvider, ProviderPreset> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [],
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    baseUrl: '',
    models: [],
  },
};

export function getPreset(provider: APIProvider): ProviderPreset {
  return PROVIDER_PRESETS[provider];
}
