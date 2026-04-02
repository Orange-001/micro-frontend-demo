import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { chatActions } from '../../store/chatSlice';
import { useStreamingResponse } from '../../hooks/useStreamingResponse';
import {
  Wrapper,
  Content,
  Logo,
  Title,
  SuggestionsGrid,
  SuggestionCard,
} from './WelcomeScreen.styles';

const SUGGESTIONS = [
  '帮我写一个 React 自定义 Hook',
  '解释一下欧拉公式',
  '前端框架对比分析',
  'AI 应用前端最佳实践',
];

export function WelcomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { sendMessage } = useStreamingResponse();
  const selectedModel = useSelector((s: RootState) => s.ui.selectedModel);
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);

  const handleSuggestion = useCallback(
    (text: string) => {
      if (!activeId) {
        dispatch(chatActions.createConversation({ model: selectedModel }));
      }
      setTimeout(() => sendMessage(text), 0);
    },
    [activeId, dispatch, selectedModel, sendMessage],
  );

  return (
    <Wrapper>
      <Content>
        <Logo>✨</Logo>
        <Title>有什么可以帮忙的？</Title>
        <SuggestionsGrid>
          {SUGGESTIONS.map((text) => (
            <SuggestionCard key={text} onClick={() => handleSuggestion(text)}>
              {text}
            </SuggestionCard>
          ))}
        </SuggestionsGrid>
      </Content>
    </Wrapper>
  );
}
