import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatView } from './views/ChatView';
import { AboutView } from './views/AboutView';

type Props = {
  basename?: string;
};

export function App({ basename = '/' }: Props) {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<ChatView />} />
        <Route path="/chat/:conversationId?" element={<ChatView />} />
        <Route path="/about" element={<AboutView />} />
      </Routes>
    </BrowserRouter>
  );
}
