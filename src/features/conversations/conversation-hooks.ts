import { useEffect, useSyncExternalStore } from 'react';

import {
  getConversationService,
  type ConversationService,
} from '@/features/conversations/conversation-service';
import { conversationStore } from '@/features/conversations/conversation-store';
import {
  selectActiveConversation,
  selectConversationById,
} from '@/features/conversations/conversation-selectors-state';
import type { Conversation, ConversationState } from '@/features/conversations/conversation-types';
import type {
  ConversationEventListener,
  ConversationEventName,
} from '@/features/conversations/conversation-events';
import type { EntityId } from '@/shared/types';

export function useConversationState(): ConversationState {
  return useSyncExternalStore(
    (listener) => conversationStore.subscribe(listener),
    () => conversationStore.getState(),
    () => conversationStore.getState(),
  );
}

export function useActiveConversation(): Conversation | null {
  return selectActiveConversation(useConversationState());
}

export function useConversation(conversationId: EntityId): Conversation | null {
  return selectConversationById(useConversationState(), conversationId);
}

export function useConversationEvent<EventName extends ConversationEventName>(
  eventName: EventName,
  listener: ConversationEventListener<EventName>,
  service: ConversationService = getConversationService(),
): void {
  useEffect(() => service.subscribe(eventName, listener), [eventName, listener, service]);
}
