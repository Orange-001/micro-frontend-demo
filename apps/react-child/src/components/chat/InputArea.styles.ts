import styled from 'styled-components';
import { Button } from 'antd';

export const InputWrapper = styled.div`
  padding: 12px 16px 24px;
  display: flex;
  justify-content: center;
`;

export const InputContainer = styled.div`
  width: 100%;
  max-width: 768px;
  background: var(--bg-input);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: var(--accent-color);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 15px;
  line-height: 24px;
  color: var(--text-primary);
  font-family: inherit;
  min-height: 24px;
  max-height: 144px;
  overflow-y: hidden;

  &::placeholder {
    color: var(--text-tertiary);
  }
`;

export const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const LeftActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const Disclaimer = styled.div`
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 0 16px 8px;
`;

export const FilePreviewList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
`;

export const PreviewCard = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover .preview-remove-btn {
    opacity: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .file-icon {
    font-size: 24px;
    color: var(--text-secondary);
  }

  .file-name {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    font-size: 10px;
    color: var(--text-primary);
    background: rgba(0, 0, 0, 0.6);
    padding: 2px 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }
`;

export const PreviewRemoveBtn = styled(Button)`
  && {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 10px;
    color: #fff;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 2;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }
  }
`;
