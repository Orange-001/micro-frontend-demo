import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const ChatView = lazy(() =>
  import('./views/ChatView').then((module) => ({ default: module.ChatView })),
);
const AboutView = lazy(() =>
  import('./views/AboutView').then((module) => ({ default: module.AboutView })),
);

type Props = {
  basename?: string;
};

export function App({ basename = '/' }: Props) {
  return (
    <BrowserRouter basename={basename}>
      <Suspense fallback={<div className="mfe-app-loading">React 子应用页面加载中...</div>}>
        <Routes>
          <Route path="/" element={<ChatView />} />
          <Route path="/chat/:conversationId?" element={<ChatView />} />
          <Route path="/about" element={<AboutView />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
