import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { WelcomeScreen } from './WelcomeScreen';
import { InputArea } from './InputArea';
import { Wrapper } from './MainArea.styles';

export function MainArea() {
  const activeId = useSelector((s: RootState) => s.chat.activeConversationId);
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const activeConversation = activeId ? conversations[activeId] : null;
  const hasMessages = activeConversation && activeConversation.messages.length > 0;

  return (
    <Wrapper>
      <ChatHeader />
      {hasMessages ? <MessageList /> : <WelcomeScreen />}
      <InputArea />
    </Wrapper>
  );
}
