import { useState, useCallback, useEffect } from 'react';
import { Button, Tooltip, Upload } from 'antd';
import {
  SendOutlined,
  PauseCircleOutlined,
  PaperClipOutlined,
  GlobalOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { chatActions } from '../../store/chatSlice';
import { uiActions } from '../../store/uiSlice';
import { useStreamingResponse } from '../../hooks/useStreamingResponse';
import { useAutoResizeTextarea } from '../../hooks/useAutoResizeTextarea';
import {
  InputWrapper,
  InputContainer,
  TextArea,
  BottomRow,
  LeftActions,
  RightActions,
  Disclaimer,
} from './InputArea.styles';

export function InputArea() {
  const dispatch = useDispatch<AppDispatch>();
  const [input, setInput] = useState('');
  const { sendMessage, stopStreaming, isStreaming } = useStreamingResponse();
  const { textareaRef, resize } = useAutoResizeTextarea(6);
  const webSearchEnabled = useSelector((s: RootState) => s.ui.webSearchEnabled);
  const deepThinkingEnabled = useSelector((s: RootState) => s.ui.deepThinkingEnabled);
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    // 如果没有活跃对话，先创建
    if (!activeId) {
      dispatch(chatActions.createConversation({ model: selectedModel }));
    }

    setInput('');
    // 延迟发送，确保新对话已创建
    setTimeout(() => {
      sendMessage(trimmed);
    }, 0);
  }, [input, isStreaming, activeId, dispatch, selectedModel, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // 重置高度当 input 变化
  useEffect(() => {
    resize();
  }, [input, resize]);

  return (
    <>
      <InputWrapper>
        <InputContainer>
          <TextArea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="发送消息..."
            rows={1}
          />
          <BottomRow>
            <LeftActions>
              <Tooltip title="上传文件">
                <Upload beforeUpload={() => false} showUploadList={false}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PaperClipOutlined />}
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                </Upload>
              </Tooltip>
              <Tooltip title={webSearchEnabled ? '关闭联网搜索' : '开启联网搜索'}>
                <Button
                  type="text"
                  size="small"
                  icon={<GlobalOutlined />}
                  onClick={() => dispatch(uiActions.toggleWebSearch())}
                  style={{
                    color: webSearchEnabled ? 'var(--accent-color)' : 'var(--text-tertiary)',
                  }}
                />
              </Tooltip>
              <Tooltip title={deepThinkingEnabled ? '关闭深度思考' : '开启深度思考'}>
                <Button
                  type="text"
                  size="small"
                  icon={<BulbOutlined />}
                  onClick={() => dispatch(uiActions.toggleDeepThinking())}
                  style={{
                    color: deepThinkingEnabled ? 'var(--accent-color)' : 'var(--text-tertiary)',
                  }}
                />
              </Tooltip>
            </LeftActions>
            <RightActions>
              {isStreaming ? (
                <Button
                  type="default"
                  shape="circle"
                  size="small"
                  icon={<PauseCircleOutlined />}
                  onClick={stopStreaming}
                />
              ) : (
                <Button
                  type="primary"
                  shape="circle"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{
                    background: input.trim() ? 'var(--accent-color)' : undefined,
                    borderColor: input.trim() ? 'var(--accent-color)' : undefined,
                  }}
                />
              )}
            </RightActions>
          </BottomRow>
        </InputContainer>
      </InputWrapper>
      <Disclaimer>ChatGPT Clone — 面试技术展示项目（Mock 数据）</Disclaimer>
    </>
  );
}
