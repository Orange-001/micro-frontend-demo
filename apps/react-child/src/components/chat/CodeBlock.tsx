/**
 * INTERVIEW TOPIC: 二面5 - 代码高亮渲染
 *
 * 代码块组件：
 * - 显示语言标签
 * - 一键复制代码内容
 * - 语法高亮由 rehype-highlight 在 MarkdownRenderer 中处理
 */

import { useState, useCallback } from 'react';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { CodeBlockWrapper, CodeHeader, CopyBtn, Pre } from './CodeBlock.styles';

interface Props {
  language: string;
  children: React.ReactNode;
  /** Plain text for clipboard copy */
  copyText: string;
}

export function CodeBlock({ language, children, copyText }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = copyText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copyText]);

  return (
    <CodeBlockWrapper>
      <CodeHeader>
        <span>{language || 'code'}</span>
        <CopyBtn onClick={handleCopy}>
          {copied ? (
            <>
              <CheckOutlined /> 已复制
            </>
          ) : (
            <>
              <CopyOutlined /> 复制
            </>
          )}
        </CopyBtn>
      </CodeHeader>
      <Pre>
        <code className={`hljs${language ? ` language-${language}` : ''}`}>{children}</code>
      </Pre>
    </CodeBlockWrapper>
  );
}
