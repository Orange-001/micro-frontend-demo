import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { WelcomeScreen } from './WelcomeScreen';
import { InputArea } from './InputArea';
import { CompactionBar } from './CompactionBar';
import { useCompaction } from '../../hooks/useCompaction';
import { Wrapper } from './MainArea.styles';

export function MainArea() {
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const activeConversation = activeId ? conversations[activeId] : null;
  const hasMessages = activeConversation && activeConversation.messages.length > 0;

  const { shouldSuggestCompaction, estimatedTokens, compactionState, compact, dismiss, resetState } =
    useCompaction();

  const showCompactionBar = shouldSuggestCompaction || compactionState !== 'idle';

  return (
    <Wrapper>
      <ChatHeader />
      {hasMessages ? <MessageList /> : <WelcomeScreen />}
      {showCompactionBar && (
        <CompactionBar
          tokens={estimatedTokens}
          compactionState={compactionState}
          onCompact={compact}
          onDismiss={dismiss}
          onResetState={resetState}
        />
      )}
      <InputArea />
    </Wrapper>
  );
}
