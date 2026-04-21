/**
 * INTERVIEW TOPIC: 三面2 - AI Agent 前端表现形式
 *
 * Agent 任务面板展示多步骤执行状态：
 * - 每个步骤有独立的状态指示器（pending/running/done/error）
 * - 展示执行详情和耗时
 * - 类似 ChatGPT 的"搜索中..."多步骤展示
 */

import { Steps } from 'antd';
import {
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import type { AgentStep } from '../../types/chat';

const PanelWrapper = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
`;

const PanelTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const statusIconMap = {
  pending: <ClockCircleOutlined style={{ color: '#999' }} />,
  running: <LoadingOutlined style={{ color: '#1890ff' }} />,
  done: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
};

interface Props {
  steps: AgentStep[];
}

export function AgentTaskPanel({ steps }: Props) {
  if (!steps || steps.length === 0) return null;

  const current = steps.findIndex((s) => s.status === 'running');
  const stepsItems = steps.map((step) => ({
    title: step.label,
    description: step.detail || '',
    icon: statusIconMap[step.status],
    status:
      step.status === 'done'
        ? ('finish' as const)
        : step.status === 'running'
          ? ('process' as const)
          : step.status === 'error'
            ? ('error' as const)
            : ('wait' as const),
  }));

  return (
    <PanelWrapper>
      <PanelTitle>
        <LoadingOutlined spin={steps.some((s) => s.status === 'running')} />
        Agent 执行中
      </PanelTitle>
      <Steps
        direction="vertical"
        size="small"
        current={current >= 0 ? current : steps.length}
        items={stepsItems}
      />
    </PanelWrapper>
  );
}
