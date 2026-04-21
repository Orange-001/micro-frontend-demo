/**
 * INTERVIEW TOPIC: 二面3 - 可扩展的 Prompt 模板引擎
 *
 * 设计思路：
 * - 支持变量替换: {{variable}}
 * - 支持条件渲染: {{#if condition}}...{{/if}}
 * - 支持循环: {{#each array}}...{{/each}}
 * - 编译为函数，可复用模板避免重复解析
 *
 * 为什么前端需要 Prompt 模板引擎：
 * - 不同场景（翻译、编程、写作）需要不同的 system prompt
 * - 用户可自定义模板，模板引擎负责变量注入
 * - 将 prompt 构建逻辑与业务逻辑解耦
 */

type TemplateData = Record<string, unknown>;

/**
 * 编译模板字符串为可执行函数
 */
export function compileTemplate(template: string): (data: TemplateData) => string {
  return (data: TemplateData) => {
    let result = template;

    // 1. 处理 {{#each array}}...{{/each}} 循环
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, body) => {
      const arr = data[key];
      if (!Array.isArray(arr)) return '';
      return arr
        .map((item) => {
          let line = body;
          if (typeof item === 'object' && item !== null) {
            Object.entries(item).forEach(([k, v]) => {
              line = line.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
            });
          } else {
            line = line.replace(/\{\{this\}\}/g, String(item));
          }
          return line;
        })
        .join('');
    });

    // 2. 处理 {{#if condition}}...{{/if}} 条件
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, body) => {
      return data[key] ? body : '';
    });

    // 3. 处理 {{variable}} 变量替换
    result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = data[key];
      return val !== undefined ? String(val) : '';
    });

    return result.trim();
  };
}

// 预置模板
export const PROMPT_TEMPLATES = {
  default: compileTemplate(
    `You are a helpful AI assistant.
{{#if context}}Reference context: {{context}}{{/if}}
{{#each history}}{{role}}: {{content}}
{{/each}}
User: {{input}}`,
  ),

  coder: compileTemplate(
    `You are an expert programmer. Respond with clean, well-commented code.
Language preference: {{language}}
{{#if framework}}Framework: {{framework}}{{/if}}
User: {{input}}`,
  ),

  translator: compileTemplate(
    `You are a professional translator. Translate the following text from {{sourceLang}} to {{targetLang}}.
Maintain the original tone and style.
Text: {{input}}`,
  ),
};
