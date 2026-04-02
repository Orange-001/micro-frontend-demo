import type { APIProvider, ProviderPreset } from '../types/chat';

export const PROVIDER_PRESETS: Record<APIProvider, ProviderPreset> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Anthropic 最新模型' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Anthropic 高性能模型' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'OpenAI 旗舰模型' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini', description: '快速且经济' },
      { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', description: 'Google 最新模型' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'Meta 开源模型' },
      { id: 'mistralai/mistral-large-latest', name: 'Mistral Large', description: 'Mistral 旗舰' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', description: 'DeepSeek V3' },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: '最强大的模型' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', description: '快速且经济' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '高性能版本' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '经典模型' },
    ],
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
