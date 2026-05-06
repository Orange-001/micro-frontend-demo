import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const markdownRenderer = fs.readFileSync(
  path.join(root, 'src/components/chat/MarkdownRenderer.tsx'),
  'utf8',
);
const markdownContent = fs.readFileSync(
  path.join(root, 'src/components/chat/MarkdownContent.tsx'),
  'utf8',
);
const messageList = fs.readFileSync(path.join(root, 'src/components/chat/MessageList.tsx'), 'utf8');
const virtualScroll = fs.readFileSync(path.join(root, 'src/hooks/useVirtualScroll.ts'), 'utf8');
const streamingResponse = fs.readFileSync(
  path.join(root, 'src/hooks/useStreamingResponse.ts'),
  'utf8',
);

const failures = [];

function fail(message) {
  failures.push(message);
}

if (!markdownRenderer.includes('lazy(')) fail('Markdown renderer should be lazy-loaded');
if (!markdownRenderer.includes('Suspense')) fail('Markdown renderer should have Suspense fallback');
if (!markdownContent.includes('memo(')) fail('MarkdownContent should be memoized');
if (!markdownContent.includes('useMemo')) fail('Markdown parsing should be memoized');
if (markdownContent.includes('dangerouslySetInnerHTML={{')) {
  fail('MarkdownContent must not use dangerouslySetInnerHTML');
}
if (!messageList.includes('useVirtualScroll')) fail('MessageList should use virtual scrolling');
if (!virtualScroll.includes('ResizeObserver')) fail('Virtual scroll should measure dynamic heights');
if (!streamingResponse.includes('frameYield')) fail('Streaming updates should yield to browser paint');

const sampleLongMarkdown = [
  '# Long Answer',
  ...Array.from({ length: 200 }, (_, i) => `- item ${i}: ${'content '.repeat(20)}`),
  '```ts',
  ...Array.from({ length: 120 }, (_, i) => `const value${i} = ${i};`),
  '```',
].join('\n');

if (sampleLongMarkdown.length < 20000) fail('long markdown sample is not large enough');

if (failures.length) {
  console.error('[long-text-rendering-check] failed');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('[long-text-rendering-check] ok');
