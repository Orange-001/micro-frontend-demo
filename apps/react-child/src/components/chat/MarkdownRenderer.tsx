/**
 * INTERVIEW TOPIC: 二面5 - 前端实现 Markdown 实时渲染，支持代码高亮和数学公式
 *
 * 技术选型：
 * - react-markdown: 将 Markdown AST 转为 React 组件树（非 dangerouslySetInnerHTML）
 * - remark-gfm: 支持 GFM 扩展（表格、删除线、任务列表）
 * - remark-math: 解析数学公式语法（$inline$ 和 $$block$$）
 * - rehype-highlight: 代码语法高亮（基于 highlight.js）
 * - rehype-katex: 将数学 AST 渲染为 KaTeX HTML
 *
 * 实时渲染挑战：
 * - 流式输出时 Markdown 可能不完整（如未闭合的代码块）
 * - react-markdown 内部有容错处理，可以渲染部分 Markdown
 * - 性能：每次 chunk 追加都触发重解析，用 memo 缓存减少开销
 */

import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CodeBlock } from './CodeBlock';
import { MermaidBlock } from './MermaidBlock';
import { AgentTaskPanel } from './AgentTaskPanel';

// rehype/remark 插件数组保持引用稳定
const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeHighlight, rehypeKatex];

interface Props {
  content: string;
}

/**
 * 从 React children 中递归提取纯文本
 * rehype-highlight 会将代码转为 <span> 元素树，String() 只会得到 [object Object]
 */
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in node) {
    return extractText((node as React.ReactElement).props.children);
  }
  return '';
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: Props) {
  // 检查是否包含 Agent 步骤标记
  const { markdownParts } = useMemo(() => parseContent(content), [content]);

  return (
    <>
      {markdownParts.map((part, index) => (
        <div key={index}>
          {part.type === 'markdown' ? (
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              rehypePlugins={rehypePlugins}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = extractText(children).replace(/\n$/, '');

                  // 行内代码
                  if (!match) {
                    return (
                      <code
                        style={{
                          background: 'var(--code-bg)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: '0.9em',
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  // Mermaid 图表
                  if (match[1] === 'mermaid') {
                    return <MermaidBlock chart={codeString} />;
                  }

                  // 代码块 — 保留 rehype-highlight 生成的高亮 span 节点
                  return (
                    <CodeBlock language={match[1]} copyText={codeString}>
                      {children}
                    </CodeBlock>
                  );
                },
                img({ src, alt, ...props }) {
                  return (
                    <img
                      src={src}
                      alt={alt || ''}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        borderRadius: '12px',
                        margin: '12px 0',
                        cursor: 'pointer',
                      }}
                      onClick={() => src && window.open(src, '_blank')}
                      {...props}
                    />
                  );
                },
              }}
            >
              {part.content}
            </ReactMarkdown>
          ) : (
            <AgentTaskPanel steps={part.steps} />
          )}
        </div>
      ))}
    </>
  );
});

type ContentPart = { type: 'markdown'; content: string } | { type: 'agent'; steps: any[] };

function parseContent(content: string): { markdownParts: ContentPart[]; agentSteps: any[] } {
  const parts: ContentPart[] = [];
  const allSteps: any[] = [];

  const regex = /\[AGENT_STEPS\]([\s\S]*?)\[\/AGENT_STEPS\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // 标记之前的 Markdown 内容
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', content: content.slice(lastIndex, match.index) });
    }

    // 解析 Agent 步骤
    try {
      const data = JSON.parse(match[1]);
      parts.push({ type: 'agent', steps: data.steps || [] });
      allSteps.push(...(data.steps || []));
    } catch {
      parts.push({ type: 'markdown', content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // 剩余内容
  if (lastIndex < content.length) {
    parts.push({ type: 'markdown', content: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'markdown', content });
  }

  return { markdownParts: parts, agentSteps: allSteps };
}
