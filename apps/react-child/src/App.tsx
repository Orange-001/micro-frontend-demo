import { HashRouter, Routes, Route } from 'react-router-dom';
import { ChatView } from './views/ChatView';
import { AboutView } from './views/AboutView';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ChatView />} />
        <Route path="/chat/:conversationId?" element={<ChatView />} />
        <Route path="/about" element={<AboutView />} />
      </Routes>
    </HashRouter>
  );
}
