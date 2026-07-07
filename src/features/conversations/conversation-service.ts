import { ConversationEvents } from '@/features/conversations/conversation-events';
import type {
  ConversationEventListener,
  ConversationEventName,
  ConversationEventUnsubscribe,
} from '@/features/conversations/conversation-events';
import { ConversationMapper } from '@/features/conversations/conversation-mapper';
import {
  InMemoryConversationRepository,
  type ConversationRepository,
} from '@/features/conversations/conversation-repository';
import { conversationStore } from '@/features/conversations/conversation-store';
import type {
  ConversationDetectionContext,
  ConversationSnapshot,
  ConversationState,
} from '@/features/conversations/conversation-types';
import type { Store } from '@/state';

export interface ConversationService {
  applySnapshot(snapshot: ConversationSnapshot): void;
  getState(): ConversationState;
  subscribe<EventName extends ConversationEventName>(
    eventName: EventName,
    listener: ConversationEventListener<EventName>,
  ): ConversationEventUnsubscribe;
}

interface ConversationServiceOptions {
  readonly events?: ConversationEvents;
  readonly repository?: ConversationRepository;
  readonly store?: Store<ConversationState>;
}

export class DefaultConversationService implements ConversationService {
  private readonly events: ConversationEvents;
  private readonly repository: ConversationRepository;
  private readonly store: Store<ConversationState>;

  public constructor(options: ConversationServiceOptions = {}) {
    this.events = options.events ?? new ConversationEvents();
    this.repository = options.repository ?? new InMemoryConversationRepository();
    this.store = options.store ?? conversationStore;
  }

  public applySnapshot(snapshot: ConversationSnapshot): void {
    try {
      const changes = this.repository.applyCandidates(
        snapshot.conversations,
        snapshot.activeConversationId,
        snapshot.capturedAt,
        snapshot.conversationListObserved,
      );
      const conversations = this.repository.getAll();

      this.store.setState({
        activeConversationId: snapshot.activeConversationId,
        conversations,
        error: null,
        status: 'ready',
      });

      for (const conversation of changes.detected) {
        this.events.emit('conversationDetected', { conversation });
      }

      for (const conversation of changes.changed) {
        this.events.emit('conversationChanged', { conversation });
      }

      for (const renamedConversation of changes.renamed) {
        this.events.emit('conversationRenamed', renamedConversation);
      }

      for (const conversationId of changes.removed) {
        this.events.emit('conversationRemoved', { conversationId });
      }

      if (changes.selected !== undefined) {
        this.events.emit('conversationSelected', {
          conversation: changes.selected,
        });
      }

      this.events.emit('conversationListChanged', { conversations });
    } catch (error) {
      this.store.setState({
        error: toError(error),
        status: 'error',
      });
      throw error;
    }
  }

  public getState(): ConversationState {
    return this.store.getState();
  }

  public subscribe<EventName extends ConversationEventName>(
    eventName: EventName,
    listener: ConversationEventListener<EventName>,
  ): ConversationEventUnsubscribe {
    return this.events.subscribe(eventName, listener);
  }
}

let defaultConversationService: ConversationService | null = null;

export function getConversationService(): ConversationService {
  defaultConversationService ??= new DefaultConversationService();

  return defaultConversationService;
}

export function createConversationSnapshot(
  context: ConversationDetectionContext,
): ConversationSnapshot {
  return new ConversationMapper().createSnapshot(context);
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown conversation detection error.');
}
