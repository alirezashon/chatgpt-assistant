import { ConversationRegistry } from '@/features/conversations/conversation-registry';
import type { ConversationRegistryChanges } from '@/features/conversations/conversation-registry';
import type {
  Conversation,
  ConversationCandidate,
} from '@/features/conversations/conversation-types';
import type { EntityId } from '@/shared/types';

export interface ConversationRepository {
  applyCandidates(
    candidates: readonly ConversationCandidate[],
    activeConversationId: EntityId | null,
    capturedAt: string,
    removeMissing: boolean,
  ): ConversationRegistryChanges;
  getActiveConversation(): Conversation | null;
  getAll(): readonly Conversation[];
  getById(conversationId: EntityId): Conversation | undefined;
}

export class InMemoryConversationRepository implements ConversationRepository {
  private readonly registry: ConversationRegistry;

  public constructor(registry: ConversationRegistry = new ConversationRegistry()) {
    this.registry = registry;
  }

  public applyCandidates(
    candidates: readonly ConversationCandidate[],
    activeConversationId: EntityId | null,
    capturedAt: string,
    removeMissing: boolean,
  ): ConversationRegistryChanges {
    return this.registry.applyCandidates(
      candidates,
      activeConversationId,
      capturedAt,
      removeMissing,
    );
  }

  public getActiveConversation(): Conversation | null {
    return this.registry.getActiveConversation();
  }

  public getAll(): readonly Conversation[] {
    return this.registry.getAll();
  }

  public getById(conversationId: EntityId): Conversation | undefined {
    return this.registry.getById(conversationId);
  }
}
