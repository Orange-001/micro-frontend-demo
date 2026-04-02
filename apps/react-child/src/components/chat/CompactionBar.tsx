import { Button, Space } from 'antd';
import { CompressOutlined, CloseOutlined } from '@ant-design/icons';
import { formatTokenCount } from '../../utils/tokenEstimation';
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

interface Props {
  tokens: number;
  isCompacting: boolean;
  onCompact: () => void;
  onDismiss: () => void;
}

export function CompactionBar({ tokens, isCompacting, onCompact, onDismiss }: Props) {
  return (
    <Bar>
      <span>对话较长 (~{formatTokenCount(tokens)} tokens)</span>
      <Space size={4}>
        <Button
          size="small"
          type="primary"
          icon={<CompressOutlined />}
          loading={isCompacting}
          onClick={onCompact}
        >
          压缩上下文
        </Button>
        <Button
          size="small"
          type="text"
          icon={<CloseOutlined />}
          onClick={onDismiss}
        />
      </Space>
    </Bar>
  );
}
