import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'src/services/promptTemplate.ts');
const source = fs.readFileSync(sourcePath, 'utf8');

const failures = [];

function fail(message) {
  failures.push(message);
}

function extractTemplate(name) {
  const pattern = new RegExp(`${name}:\\s*compileTemplate\\(\\s*\`([\\s\\S]*?)\`\\s*,?\\s*\\)`, 'm');
  return source.match(pattern)?.[1] ?? null;
}

function renderTemplate(template, data) {
  let result = template;

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

  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, body) =>
    data[key] ? body : '',
  );

  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    data[key] !== undefined ? String(data[key]) : '',
  );

  return result.trim();
}

function checkBalancedBlocks(name, template, blockName) {
  const open = [...template.matchAll(new RegExp(`\\{\\{#${blockName}\\s+\\w+\\}\\}`, 'g'))].length;
  const close = [...template.matchAll(new RegExp(`\\{\\{/${blockName}\\}\\}`, 'g'))].length;
  if (open !== close) {
    fail(`${name}: ${blockName} block mismatch, open=${open}, close=${close}`);
  }
}

const cases = {
  default: {
    input: 'Explain RAG',
    context: 'RAG means retrieval augmented generation.',
    history: [
      { role: 'user', content: 'What is RAG?' },
      { role: 'assistant', content: 'RAG combines retrieval and generation.' },
    ],
  },
  coder: {
    language: 'TypeScript',
    framework: 'React',
    input: 'Write a debounce hook.',
  },
  translator: {
    sourceLang: 'English',
    targetLang: 'Chinese',
    input: 'Hello world.',
  },
};

for (const [name, data] of Object.entries(cases)) {
  const template = extractTemplate(name);
  if (!template) {
    fail(`missing prompt template: ${name}`);
    continue;
  }

  checkBalancedBlocks(name, template, 'if');
  checkBalancedBlocks(name, template, 'each');

  const rendered = renderTemplate(template, data);
  if (!rendered) fail(`${name}: rendered prompt is empty`);
  if (/\{\{[#/]?\w+/.test(rendered)) fail(`${name}: unresolved template syntax remains`);
  if (rendered.length > 4000) fail(`${name}: rendered sample prompt is too large`);
}

if (!source.includes('PROMPT_TEMPLATES')) fail('PROMPT_TEMPLATES export not found');
if (!source.includes('compileTemplate')) fail('compileTemplate export not found');

if (failures.length) {
  console.error('[prompt-template-check] failed');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('[prompt-template-check] ok');
