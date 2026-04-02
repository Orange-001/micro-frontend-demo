import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Conversation, Message, Reaction } from '../types/chat';

interface ChatState {
  conversations: Record<string, Conversation>;
  conversationOrder: string[];
  activeConversationId: string | null;
  isStreaming: boolean;
  streamingMessageId: string | null;
}

const initialState: ChatState = {
  conversations: {},
  conversationOrder: [],
  activeConversationId: null,
  isStreaming: false,
  streamingMessageId: null,
};

let idCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    loadFromStorage(state, action: PayloadAction<Partial<ChatState>>) {
      const { conversations, conversationOrder, activeConversationId } = action.payload;
      if (conversations) state.conversations = conversations;
      if (conversationOrder) state.conversationOrder = conversationOrder;
      if (activeConversationId !== undefined) state.activeConversationId = activeConversationId;
    },

    createConversation(state, action: PayloadAction<{ model: string }>) {
      const id = generateId('conv');
      const now = Date.now();
      const conv: Conversation = {
        id,
        title: 'New Chat',
        messages: [],
        model: action.payload.model,
        createdAt: now,
        updatedAt: now,
      };
      state.conversations[id] = conv;
      state.conversationOrder.unshift(id);
      state.activeConversationId = id;
    },

    deleteConversation(state, action: PayloadAction<string>) {
      const id = action.payload;
      delete state.conversations[id];
      state.conversationOrder = state.conversationOrder.filter((cid) => cid !== id);
      if (state.activeConversationId === id) {
        state.activeConversationId = state.conversationOrder[0] ?? null;
      }
    },

    renameConversation(state, action: PayloadAction<{ id: string; title: string }>) {
      const conv = state.conversations[action.payload.id];
      if (conv) conv.title = action.payload.title;
    },

    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },

    addMessage(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
      const { conversationId, message } = action.payload;
      const conv = state.conversations[conversationId];
      if (!conv) return;
      conv.messages.push(message);
      conv.updatedAt = Date.now();
      // 自动标题：用第一条用户消息的前 30 个字符
      if (message.role === 'user' && conv.title === 'New Chat') {
        conv.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
      }
      // 移到列表顶部
      state.conversationOrder = [
        conversationId,
        ...state.conversationOrder.filter((id) => id !== conversationId),
      ];
    },

    startStreaming(state, action: PayloadAction<{ conversationId: string; messageId: string }>) {
      state.isStreaming = true;
      state.streamingMessageId = action.payload.messageId;
      const conv = state.conversations[action.payload.conversationId];
      if (conv) {
        conv.messages.push({
          id: action.payload.messageId,
          role: 'assistant',
          content: '',
          createdAt: Date.now(),
          isStreaming: true,
          reaction: null,
          attachments: [],
        });
      }
    },

    appendStreamChunk(state, action: PayloadAction<{ conversationId: string; content: string }>) {
      const conv = state.conversations[action.payload.conversationId];
      if (!conv) return;
      const msg = conv.messages.find((m) => m.id === state.streamingMessageId);
      if (msg) msg.content += action.payload.content;
    },

    finalizeStreaming(state, action: PayloadAction<string>) {
      const conv = state.conversations[action.payload];
      if (conv) {
        const msg = conv.messages.find((m) => m.id === state.streamingMessageId);
        if (msg) msg.isStreaming = false;
        conv.updatedAt = Date.now();
      }
      state.isStreaming = false;
      state.streamingMessageId = null;
    },

    editUserMessage(
      state,
      action: PayloadAction<{ conversationId: string; messageId: string; content: string }>,
    ) {
      const { conversationId, messageId, content } = action.payload;
      const conv = state.conversations[conversationId];
      if (!conv) return;
      const idx = conv.messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      conv.messages[idx].content = content;
      // 删除此消息之后的所有消息（准备重新生成）
      conv.messages = conv.messages.slice(0, idx + 1);
    },

    deleteLastAssistantMessage(state, action: PayloadAction<string>) {
      const conv = state.conversations[action.payload];
      if (!conv) return;
      const lastMsg = conv.messages[conv.messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        conv.messages.pop();
      }
    },

    toggleReaction(
      state,
      action: PayloadAction<{ conversationId: string; messageId: string; reaction: Reaction }>,
    ) {
      const conv = state.conversations[action.payload.conversationId];
      if (!conv) return;
      const msg = conv.messages.find((m) => m.id === action.payload.messageId);
      if (msg) {
        msg.reaction = msg.reaction === action.payload.reaction ? null : action.payload.reaction;
      }
    },
  },
});

export const chatActions = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
