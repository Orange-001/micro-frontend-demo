/**
 * 联网搜索服务
 * 使用 SearXNG 兼容的 JSON API 进行搜索
 * SearXNG 是免费开源的元搜索引擎，用户可自部署实例
 * API 格式: https://searxng.example/search?q=xxx&format=json
 */

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * 调用 SearXNG JSON API 获取搜索结果
 */
export async function searchWeb(query: string, baseUrl: string): Promise<SearchResult[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/search?q=${encodeURIComponent(query)}&format=json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Search API error ${response.status}`);
  }

  const json = await response.json();

  // SearXNG 返回格式
  const results: SearchResult[] = (json.results ?? [])
    .slice(0, 5) // 最多取 5 条，避免上下文过长
    .map((r: any) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      content: r.content ?? '',
    }));

  return results;
}

/**
 * 将搜索结果格式化为 LLM 可读的上下文文本
 */
export function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return '';

  const sections = results.map(
    (r, i) => `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    ${r.content}`,
  );

  return `以下是联网搜索获取到的参考信息：\n\n${sections.join('\n\n')}\n\n请基于以上搜索结果回答用户的问题，并在回答中标注引用来源。`;
}
