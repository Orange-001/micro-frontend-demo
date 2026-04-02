/**
 * INTERVIEW TOPIC: 三面4 - 生成式 UI (Generative UI)
 *
 * 生成式 UI 的核心思想：
 * - AI 不仅返回文本，还可以返回结构化数据
 * - 前端根据数据类型动态渲染对应的 UI 组件
 * - 例如：返回表格数据渲染为可排序表格，返回图表数据渲染为可视化图表
 *
 * 对前端开发的影响：
 * - 需要设计灵活的组件注册机制
 * - UI 渲染从"静态模板"变为"动态组合"
 * - 前端需要更强的错误边界处理（AI 可能返回不规范数据）
 */

import { Table, Card } from 'antd';
import styled from 'styled-components';
import type { GenerativeUIType } from '../../types/chat';

const ChartPlaceholder = styled.div`
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
`;

interface GenerativeUIProps {
  type: GenerativeUIType;
  data: any;
}

// 组件注册表 — 可扩展的动态渲染机制
const componentRegistry: Record<string, React.FC<{ data: any }>> = {
  table: ({ data }) => {
    if (!data?.columns || !data?.rows) return null;
    return (
      <Table
        columns={data.columns}
        dataSource={data.rows}
        pagination={false}
        size="small"
        bordered
        style={{ margin: '12px 0' }}
      />
    );
  },

  chart: ({ data }) => (
    <ChartPlaceholder>
      📊 图表组件 — {data?.title || '数据可视化'}
      <br />
      <small>（可集成 ECharts / Recharts 等图表库）</small>
    </ChartPlaceholder>
  ),

  card: ({ data }) => (
    <Card
      title={data?.title}
      size="small"
      style={{ margin: '12px 0' }}
    >
      {data?.content}
    </Card>
  ),
};

export function GenerativeUI({ type, data }: GenerativeUIProps) {
  const Component = componentRegistry[type];
  if (!Component) return null;
  return <Component data={data} />;
}
