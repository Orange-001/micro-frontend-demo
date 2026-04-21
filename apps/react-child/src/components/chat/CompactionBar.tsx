import { Button, Space } from 'antd';
import {
  CompressOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { formatTokenCount } from '../../utils/tokenEstimation';
import type { CompactionState } from '../../hooks/useCompaction';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-secondary);
`;

const StatusIcon = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
  margin-right: 4px;
`;

const StatusWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const STATUS_CONFIG: Record<
  Exclude<CompactionState, 'idle'>,
  { text: string; icon: typeof CheckCircleOutlined; color: string }
> = {
  compacting: {
    text: '压缩中，请稍候...',
    icon: CompressOutlined as any,
    color: 'var(--accent-color)',
  },
  success: {
    text: '压缩成功',
    icon: CheckCircleOutlined,
    color: '#52c41a',
  },
  error: {
    text: '压缩失败，请重试',
    icon: WarningOutlined,
    color: '#ff4d4f',
  },
};

interface Props {
  tokens: number;
  compactionState: CompactionState;
  onCompact: () => void;
  onDismiss: () => void;
  onResetState: () => void;
}

export function CompactionBar({
  tokens,
  compactionState,
  onCompact,
  onDismiss,
  onResetState,
}: Props) {
  if (compactionState === 'idle') {
    return (
      <Bar>
        <span>对话较长 (~{formatTokenCount(tokens)} tokens)</span>
        <Space size={4}>
          <Button size="small" type="primary" icon={<CompressOutlined />} onClick={onCompact}>
            压缩上下文
          </Button>
          <Button size="small" type="text" icon={<CloseOutlined />} onClick={onDismiss} />
        </Space>
      </Bar>
    );
  }

  const config = STATUS_CONFIG[compactionState];
  const isTerminal = compactionState === 'success' || compactionState === 'error';

  return (
    <Bar>
      <StatusWrapper>
        <StatusIcon $color={config.color}>
          <config.icon spin={compactionState === 'compacting'} />
        </StatusIcon>
        <span>{config.text}</span>
      </StatusWrapper>
      {isTerminal && (
        <Space size={4}>
          <Button
            size="small"
            type="primary"
            icon={<CompressOutlined />}
            onClick={() => {
              onResetState();
              onCompact();
            }}
          >
            重试
          </Button>
          <Button size="small" type="text" icon={<CloseOutlined />} onClick={onDismiss} />
        </Space>
      )}
    </Bar>
  );
}
