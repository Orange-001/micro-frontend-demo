/**
 * 动态获取模型列表
 * 兼容 OpenAI 和 OpenRouter 的 /models 接口
 */

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

/**
 * 从 /models 端点获取模型列表
 * OpenAI 返回格式: { data: [{ id, owned_by, ... }] }
 * OpenRouter 返回格式: { data: [{ id, name, ... }] }
 */
export async function fetchModels(
  baseUrl: string,
  apiKey: string,
  provider: 'openrouter' | 'openai',
): Promise<ModelOption[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/models`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
  }

  const response = await fetch(url, { method: 'GET', headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const rawModels: any[] = json.data ?? [];

  // OpenRouter 返回 { data: [{ id: "anthropic/claude-sonnet-4", name: "...", ... }] }
  if (provider === 'openrouter') {
    return rawModels
      .map((m) => ({
        id: m.id,
        name: m.name ?? m.id,
        description: m.description ?? '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // OpenAI 返回 { data: [{ id: "gpt-4o", object: "model", owned_by: "openai", ... }] }
  return rawModels
    .filter((m) => m.id.startsWith('gpt-') || m.id.startsWith('o'))
    .map((m) => ({
      id: m.id,
      name: m.id,
      description: `Owned by ${m.owned_by ?? 'unknown'}`,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
