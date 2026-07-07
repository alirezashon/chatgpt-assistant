import type { Conversation } from '@/features/conversations/conversation-types';
import type { EntityId } from '@/shared/types';

export interface ConversationEventMap {
  readonly conversationChanged: {
    readonly conversation: Conversation;
  };
  readonly conversationDetected: {
    readonly conversation: Conversation;
  };
  readonly conversationListChanged: {
    readonly conversations: readonly Conversation[];
  };
  readonly conversationRemoved: {
    readonly conversationId: EntityId;
  };
  readonly conversationRenamed: {
    readonly conversation: Conversation;
    readonly previousTitle: string;
  };
  readonly conversationSelected: {
    readonly conversation: Conversation | null;
  };
}

export type ConversationEventName = keyof ConversationEventMap;
export type ConversationEventListener<EventName extends ConversationEventName> = (
  payload: ConversationEventMap[EventName],
) => void;
export type ConversationEventUnsubscribe = () => void;

export class ConversationEvents {
  private readonly listeners = new Map<
    ConversationEventName,
    Set<ConversationEventListener<ConversationEventName>>
  >();

  public emit<EventName extends ConversationEventName>(
    eventName: EventName,
    payload: ConversationEventMap[EventName],
  ): void {
    const eventListeners = this.listeners.get(eventName);

    if (eventListeners === undefined) {
      return;
    }

    for (const listener of eventListeners) {
      listener(payload);
    }
  }

  public subscribe<EventName extends ConversationEventName>(
    eventName: EventName,
    listener: ConversationEventListener<EventName>,
  ): ConversationEventUnsubscribe {
    const eventListeners = this.listeners.get(eventName) ?? new Set();
    eventListeners.add(listener as ConversationEventListener<ConversationEventName>);
    this.listeners.set(eventName, eventListeners);

    return () => {
      eventListeners.delete(listener as ConversationEventListener<ConversationEventName>);
    };
  }
}
