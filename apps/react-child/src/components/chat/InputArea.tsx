import { useState, useCallback, useEffect } from 'react';
import { Button, Tooltip, Upload, message, Image } from 'antd';
import {
  SendOutlined,
  PauseCircleOutlined,
  PaperClipOutlined,
  GlobalOutlined,
  BulbOutlined,
  CloseOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { chatActions } from '../../store/chatSlice';
import { uiActions } from '../../store/uiSlice';
import { useStreamingResponse } from '../../hooks/useStreamingResponse';
import { useAutoResizeTextarea } from '../../hooks/useAutoResizeTextarea';
import { processFile, validateFiles } from '../../services/fileUtils';
import type { PendingFileAttachment } from '../../types/chat';
import {
  InputWrapper,
  InputContainer,
  TextArea,
  BottomRow,
  LeftActions,
  RightActions,
  Disclaimer,
  FilePreviewList,
  PreviewCard,
  PreviewRemoveBtn,
} from './InputArea.styles';

export function InputArea() {
  const dispatch = useDispatch<AppDispatch>();
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const { sendMessage, stopStreaming, isStreaming } = useStreamingResponse();
  const { textareaRef, resize } = useAutoResizeTextarea(6);
  const webSearchEnabled = useSelector((s: RootState) => s.ui.webSearchEnabled);
  const deepThinkingEnabled = useSelector((s: RootState) => s.ui.deepThinkingEnabled);
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if ((!trimmed && pendingFiles.length === 0) || isStreaming) return;

    // 如果没有活跃对话，先创建
    if (!activeId) {
      dispatch(chatActions.createConversation({ model: selectedModel }));
    }

    const filesToSend = [...pendingFiles];
    setInput('');
    setPendingFiles([]);
    // 延迟发送，确保新对话已创建
    setTimeout(() => {
      sendMessage(trimmed, filesToSend);
    }, 0);
  }, [input, pendingFiles, isStreaming, activeId, dispatch, selectedModel, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // 中文输入法正在组合时，不触发发送
      if (e.nativeEvent.isComposing) return;
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

  const handleBeforeUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const processed = await processFile(file);
      setPendingFiles((prev) => [...prev, processed]);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setUploading(false);
    }
    return false;
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length === 0) return;

      e.preventDefault();

      const { valid, errors } = validateFiles(files);
      if (errors.length) errors.forEach((err) => message.warning(err));

      setUploading(true);
      try {
        const processed = await Promise.all(valid.map(processFile));
        setPendingFiles((prev) => [...prev, ...processed]);
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  return (
    <>
      <InputWrapper>
        <InputContainer>
          <TextArea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="发送消息..."
            rows={1}
          />
          {pendingFiles.length > 0 && (
            <FilePreviewList>
              {pendingFiles.map((f) => (
                <PreviewCard key={f.id}>
                  {f.preview ? (
                    <Image
                      src={f.preview}
                      alt={f.name}
                      preview={{
                        mask: false,
                      }}
                    />
                  ) : (
                    <div className="file-icon">
                      <FileOutlined />
                    </div>
                  )}
                  <span className="file-name" title={f.name}>
                    {f.name}
                  </span>
                  <PreviewRemoveBtn
                    icon={<CloseOutlined />}
                    size="small"
                    type="text"
                    className="preview-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(f.id);
                    }}
                  />
                </PreviewCard>
              ))}
            </FilePreviewList>
          )}
          <BottomRow>
            <LeftActions>
              <Tooltip title="上传文件">
                <Upload
                  multiple
                  beforeUpload={handleBeforeUpload}
                  showUploadList={false}
                  accept="image/jpeg,image/png,image/webp,image/gif,.txt,.md,.pdf,.doc,.docx,.csv,.json,.xml,.html,.css,.js,.ts,.tsx,.py,.java,.go,.rs,.c,.cpp,.h,.sh,.yaml,.yml,.toml,.ini,.log,.sql"
                  disabled={uploading}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<PaperClipOutlined />}
                    style={{
                      color:
                        pendingFiles.length > 0
                          ? 'var(--accent-color)'
                          : 'var(--text-tertiary)',
                    }}
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
                  disabled={!input.trim() && pendingFiles.length === 0}
                  style={{
                    background:
                      input.trim() || pendingFiles.length > 0
                        ? 'var(--accent-color)'
                        : undefined,
                    borderColor:
                      input.trim() || pendingFiles.length > 0
                        ? 'var(--accent-color)'
                        : undefined,
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
