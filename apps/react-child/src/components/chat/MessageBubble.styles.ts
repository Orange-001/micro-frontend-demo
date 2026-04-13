/**
 * INTERVIEW TOPIC: 一面3 - CSS 居中方式
 *
 * 在 AI 对话框布局中推荐 Flexbox 居中：
 * - 消息容器使用 flex + max-width 实现水平居中
 * - 头像和内容使用 flex + align-items: flex-start 实现垂直对齐
 *
 * 为什么不用 Grid：
 * - Flexbox 更适合一维（行）布局，消息气泡本质是行排列
 * - Grid 更适合二维布局（如欢迎页的建议卡片）
 *
 * 为什么不用 absolute + transform：
 * - 脱离文档流，对动态高度的消息不友好
 * - 无法自适应内容宽度
 */

import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const BubbleWrapper = styled.div<{ $role: string }>`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: ${fadeIn} 0.3s ease-out;
  padding: ${(p) => (p.$role === 'user' ? '0' : '0')};
`;

export const AvatarWrapper = styled.div<{ $role: string }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  background: ${(p) => (p.$role === 'user' ? 'var(--accent-color)' : '#ab68ff')};
  color: white;
`;

export const ContentWrapper = styled.div<{ $role: string }>`
  flex: 1;
  min-width: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);

  /* Markdown 内容样式 */
  p { margin: 0 0 12px; }
  p:last-child { margin-bottom: 0; }
  ul, ol { margin: 0 0 12px; padding-left: 24px; }
  blockquote {
    margin: 0 0 12px;
    padding: 4px 16px;
    border-left: 3px solid var(--accent-color);
    color: var(--text-secondary);
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0 0 12px;
    font-size: 14px;
  }
  th, td {
    border: 1px solid var(--border-color);
    padding: 8px 12px;
    text-align: left;
  }
  th { background: var(--bg-secondary); font-weight: 600; }
  a { color: var(--accent-color); }
  strong { font-weight: 600; }
  hr {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 16px 0;
  }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

export const StreamingCursor = styled.span`
  display: inline-block;
  width: 7px;
  height: 18px;
  background: var(--accent-color);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ${blink} 1s step-end infinite;
`;

export const ActionsRow = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.15s;

  ${BubbleWrapper}:hover & {
    opacity: 1;
  }

  .edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-tertiary);
    padding: 2px 4px;
    font-size: 14px;
    border-radius: 4px;
    transition: color 0.15s;

    &:hover {
      color: var(--accent-color);
    }
  }
`;

export const AttachmentGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

export const AttachmentImage = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 12px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
`;

export const AttachmentFile = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-primary);
  max-width: 200px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const EditTextarea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.6;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  resize: vertical;
  font-family: inherit;
  outline: none;
  min-height: 60px;

  &:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-color);
  }
`;

export const EditButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;

  button {
    padding: 4px 16px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s;
  }

  button:first-child {
    background: var(--accent-color);
    color: white;
    border-color: var(--accent-color);

    &:hover {
      opacity: 0.85;
    }
  }

  button:last-child {
    background: var(--bg-secondary);
    color: var(--text-secondary);

    &:hover {
      color: var(--text-primary);
    }
  }
`;
