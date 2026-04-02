import styled from 'styled-components';

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
