import { Button } from 'antd';
import { ArrowDownOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const FloatingBtn = styled.div`
  position: absolute;
  bottom: 140px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
`;

interface Props {
  onClick: () => void;
}

export function ScrollToBottom({ onClick }: Props) {
  return (
    <FloatingBtn>
      <Button
        shape="circle"
        icon={<ArrowDownOutlined />}
        onClick={onClick}
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          background: 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
        }}
      />
    </FloatingBtn>
  );
}
