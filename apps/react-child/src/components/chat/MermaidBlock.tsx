import { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  CopyOutlined,
  CheckOutlined,
  DownloadOutlined,
  CodeOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

type MermaidApi = typeof import('mermaid').default;

let mermaidInstance: MermaidApi | null = null;
let mermaidInitialized = false;

async function getMermaid() {
  if (!mermaidInstance) {
    mermaidInstance = (await import('mermaid')).default;
  }

  if (mermaidInitialized) return mermaidInstance;

  mermaidInstance.initialize({
    startOnLoad: false,
    theme: 'default',
    // strict 会强制 htmlLabels:false，用 SVG <text> 测量宽度，中文/混合文本会被截断
    // loose 允许 htmlLabels:true（默认），用 <foreignObject> HTML 布局，文本测量准确
    securityLevel: 'loose',
  });
  mermaidInitialized = true;

  return mermaidInstance;
}

let idCounter = 0;

/**
 * 预处理 Mermaid 代码，将节点标签中含有特殊字符（括号等）的文本用双引号包裹，
 * 避免 Mermaid 解析器把 `factorial(n)` 中的 `(` 误认为节点形状语法。
 */
function preprocessChart(raw: string): string {
  return raw
    .replace(/\[([^\]"]+)\]/g, (m, text) => (/[(){}]/.test(text) ? `["${text}"]` : m))
    .replace(/\(([^)"]+)\)/g, (m, text) => (/[[\]{}]/.test(text) ? `("${text}")` : m))
    .replace(/\{([^}"]+)\}/g, (m, text) => (/[()[\]]/.test(text) ? `{"${text}"}` : m));
}

/** 将 SVG 字符串转为 PNG Blob（2x 高清） */
/**
 * 以 viewBox 为准裁切 SVG，去掉多余留白，
 * 并注入显式 width/height + 白色背景，确保导出完整清晰。
 */
function prepareSvg(svgStr: string): { svg: string; width: number; height: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgStr, 'image/svg+xml');
  const svgEl = doc.querySelector('svg')!;

  // viewBox 是图表内容的真实边界，优先使用
  const viewBox = svgEl.getAttribute('viewBox');
  let width = 0;
  let height = 0;

  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4) {
      width = parts[2];
      height = parts[3];
    }
  }

  if (!width) width = parseFloat(svgEl.getAttribute('width') || '') || 800;
  if (!height) height = parseFloat(svgEl.getAttribute('height') || '') || 600;

  // 用 viewBox 尺寸覆盖 width/height，消除容器撑开的多余空白
  svgEl.setAttribute('width', String(width));
  svgEl.setAttribute('height', String(height));
  // 移除 Mermaid 注入的 max-width / style，避免影响离屏渲染
  svgEl.removeAttribute('style');

  // 注入白色背景，导出到剪贴板 / 文件时不会是透明底
  const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', '#ffffff');
  svgEl.insertBefore(rect, svgEl.firstChild);

  return { svg: new XMLSerializer().serializeToString(svgEl), width, height };
}

/** 将 SVG 转为高清 PNG Blob（默认 4x） */
function svgToPngBlob(svgStr: string, scale = 4): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { svg, width, height } = prepareSvg(svgStr);
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/png',
      );
    };
    img.onerror = () => reject(new Error('SVG load failed'));
    img.src = dataUrl;
  });
}

// ---------- Styles ----------

const Wrapper = styled.div`
  position: relative;
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--code-bg);
  border: 1px solid var(--border-color);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const ActionBtn = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
`;

const DiagramArea = styled.div`
  padding: 16px;
  overflow: auto;
  display: flex;
  justify-content: center;

  svg {
    max-width: 100%;
    height: auto;
  }
`;

const SourceArea = styled.pre`
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
  border-top: 1px solid var(--border-color);
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  color: var(--text-primary);
`;

// ---------- Component ----------

interface Props {
  chart: string;
}

type CopiedState = '' | 'image' | 'source';

export const MermaidBlock = memo(function MermaidBlock({ chart }: Props) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState<CopiedState>('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const markCopied = useCallback((type: CopiedState) => {
    setCopied(type);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(''), 2000);
  }, []);

  // ---- render mermaid ----
  useEffect(() => {
    if (!chart.trim()) return;
    const id = `mermaid-${++idCounter}`;
    let cancelled = false;

    getMermaid()
      .then((mermaid) => mermaid.render(id, preprocessChart(chart.trim())))
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  // ---- actions ----
  const handleCopyImage = useCallback(async () => {
    if (!svg) return;
    try {
      const blob = await svgToPngBlob(svg);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      markCopied('image');
    } catch {
      // 回退：复制 SVG 文本
      await navigator.clipboard.writeText(svg);
      markCopied('image');
    }
  }, [svg, markCopied]);

  const handleDownload = useCallback(async () => {
    if (!svg) return;
    try {
      const blob = await svgToPngBlob(svg);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mermaid-diagram.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* noop */
    }
  }, [svg]);

  const handleCopySource = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(chart);
      markCopied('source');
    } catch {
      /* noop */
    }
  }, [chart, markCopied]);

  // ---- error state ----
  if (error) {
    return (
      <Wrapper>
        <Header>
          <span>mermaid</span>
        </Header>
        <div
          style={{ color: 'var(--error-color, #e53e3e)', fontSize: '0.85em', padding: '12px 16px' }}
        >
          Mermaid render error: {error}
        </div>
      </Wrapper>
    );
  }

  // ---- loading state ----
  if (!svg) {
    return (
      <Wrapper>
        <Header>
          <span>mermaid</span>
        </Header>
        <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85em' }}>
          Rendering diagram...
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header>
        <span>mermaid</span>
        <Actions>
          <ActionBtn onClick={handleCopyImage} title="复制图片">
            {copied === 'image' ? (
              <>
                <CheckOutlined /> 已复制
              </>
            ) : (
              <>
                <PictureOutlined /> 复制图片
              </>
            )}
          </ActionBtn>
          <ActionBtn onClick={handleDownload} title="下载 PNG">
            <DownloadOutlined /> 下载
          </ActionBtn>
          <ActionBtn onClick={handleCopySource} title="复制源代码">
            {copied === 'source' ? (
              <>
                <CheckOutlined /> 已复制
              </>
            ) : (
              <>
                <CodeOutlined /> 源码
              </>
            )}
          </ActionBtn>
          <ActionBtn
            onClick={() => setShowSource((v) => !v)}
            title={showSource ? '隐藏源码' : '查看源码'}
          >
            <CopyOutlined /> {showSource ? '隐藏' : '查看'}源码
          </ActionBtn>
        </Actions>
      </Header>
      <DiagramArea dangerouslySetInnerHTML={{ __html: svg }} />
      {showSource && <SourceArea>{chart}</SourceArea>}
    </Wrapper>
  );
});
