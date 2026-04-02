/**
 * INTERVIEW TOPIC: 一面3 - CSS 居中方式
 *
 * 欢迎页使用 Grid 布局实现二维居中：
 * - place-items: center 同时实现水平和垂直居中
 * - 建议卡片使用 Grid 的 auto-fit 实现响应式网格
 *
 * 对比 Flexbox 居中：
 * - Flexbox: display:flex + justify-content:center + align-items:center（一维）
 * - Grid: display:grid + place-items:center（二维，更简洁）
 * - 此处选择 Grid 因为卡片区域是二维网格布局
 */

import styled from 'styled-components';

export const Wrapper = styled.div`
  flex: 1;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow-y: auto;
`;

export const Content = styled.div`
  text-align: center;
  max-width: 640px;
  width: 100%;
`;

export const Logo = styled.div`
  font-size: 28px;
  margin-bottom: 8px;
`;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 32px;
`;

export const SuggestionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;
`;

export const SuggestionCard = styled.button`
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: var(--bg-hover);
    border-color: var(--accent-color);
  }
`;
