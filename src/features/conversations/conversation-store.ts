import type { ConversationState } from '@/features/conversations/conversation-types';
import { createStore } from '@/state';

export const initialConversationState: ConversationState = {
  activeConversationId: null,
  conversations: [],
  error: null,
  status: 'idle',
};

export const conversationStore = createStore<ConversationState>(initialConversationState);
