import { lazy, memo, Suspense } from 'react';

const MarkdownContent = lazy(() =>
  import('./MarkdownContent').then((module) => ({ default: module.MarkdownContent })),
);

interface Props {
  content: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: Props) {
  return (
    <Suspense fallback={<div className="markdown-loading">Markdown 渲染器加载中...</div>}>
      <MarkdownContent content={content} />
    </Suspense>
  );
});
