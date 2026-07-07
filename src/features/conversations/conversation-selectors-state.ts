import type { Conversation, ConversationState } from '@/features/conversations/conversation-types';
import type { EntityId } from '@/shared/types';

export function selectActiveConversation(state: ConversationState): Conversation | null {
  if (state.activeConversationId === null) {
    return null;
  }

  return (
    state.conversations.find((conversation) => conversation.id === state.activeConversationId) ??
    null
  );
}

export function selectConversationById(
  state: ConversationState,
  conversationId: EntityId,
): Conversation | null {
  return state.conversations.find((conversation) => conversation.id === conversationId) ?? null;
}
