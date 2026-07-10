import type {
  Conversation,
  ConversationCandidate,
} from '@/features/conversations/conversation-types';
import type { EntityId } from '@/shared/types';

export interface ConversationRegistryChanges {
  readonly changed: readonly Conversation[];
  readonly detected: readonly Conversation[];
  readonly removed: readonly EntityId[];
  readonly renamed: readonly {
    readonly conversation: Conversation;
    readonly previousTitle: string;
  }[];
  readonly selected: Conversation | null | undefined;
}

export class ConversationRegistry {
  private activeConversationId: EntityId | null = null;
  private readonly conversationsById = new Map<EntityId, Conversation>();

  public getActiveConversation(): Conversation | null {
    if (this.activeConversationId === null) {
      return null;
    }

    return this.conversationsById.get(this.activeConversationId) ?? null;
  }

  public getAll(): readonly Conversation[] {
    return Array.from(this.conversationsById.values());
  }

  public getById(conversationId: EntityId): Conversation | undefined {
    return this.conversationsById.get(conversationId);
  }

  public replaceConversation(conversation: Conversation): void {
    this.conversationsById.set(conversation.id, conversation);
  }

  public applyCandidates(
    candidates: readonly ConversationCandidate[],
    activeConversationId: EntityId | null,
    capturedAt: string,
    removeMissing: boolean,
  ): ConversationRegistryChanges {
    const detected: Conversation[] = [];
    const changed: Conversation[] = [];
    const renamed: {
      readonly conversation: Conversation;
      readonly previousTitle: string;
    }[] = [];
    const previousActiveConversationId = this.activeConversationId;
    const seenIds = new Set<EntityId>();

    for (const candidate of candidates) {
      seenIds.add(candidate.id);

      const existingConversation = this.conversationsById.get(candidate.id);

      if (existingConversation === undefined) {
        const conversation = createConversationFromCandidate(candidate, capturedAt);
        this.conversationsById.set(conversation.id, conversation);
        detected.push(conversation);
        continue;
      }

      const nextConversation = updateConversationFromCandidate(existingConversation, candidate);

      if (hasConversationChanged(existingConversation, nextConversation)) {
        this.conversationsById.set(nextConversation.id, nextConversation);
        changed.push(nextConversation);

        if (existingConversation.title !== nextConversation.title) {
          renamed.push({
            conversation: nextConversation,
            previousTitle: existingConversation.title,
          });
        }
      }
    }

    const removed: EntityId[] = [];

    if (removeMissing) {
      for (const conversationId of this.conversationsById.keys()) {
        if (!seenIds.has(conversationId) && conversationId !== activeConversationId) {
          this.conversationsById.delete(conversationId);
          removed.push(conversationId);
        }
      }
    }

    this.activeConversationId = activeConversationId;
    this.markActiveConversation();

    const selected =
      previousActiveConversationId === this.activeConversationId
        ? undefined
        : this.getActiveConversation();

    return {
      changed,
      detected,
      removed,
      renamed,
      selected,
    };
  }

  private markActiveConversation(): void {
    for (const conversation of this.conversationsById.values()) {
      const shouldBeActive = conversation.id === this.activeConversationId;

      if (conversation.isActive !== shouldBeActive) {
        this.conversationsById.set(conversation.id, {
          ...conversation,
          isActive: shouldBeActive,
        });
      }
    }
  }
}

function createConversationFromCandidate(
  candidate: ConversationCandidate,
  capturedAt: string,
): Conversation {
  return {
    createdAt: capturedAt,
    favorite: false,
    folderId: null,
    id: candidate.id,
    isActive: candidate.isActive,
    isArchived: false,
    metadata: candidate.metadata,
    tags: [],
    title: candidate.title,
    updatedAt: capturedAt,
    url: candidate.url,
  };
}

function updateConversationFromCandidate(
  conversation: Conversation,
  candidate: ConversationCandidate,
): Conversation {
  const localTitle = conversation.metadata.localTitle;
  const title = localTitle ?? candidate.title;

  return {
    ...conversation,
    isActive: candidate.isActive,
    metadata: {
      ...candidate.metadata,
      ...(localTitle === undefined
        ? {
            titleSource: 'provider' as const,
          }
        : {
            localTitle,
            providerTitle: candidate.title,
            titleSource: 'local' as const,
          }),
    },
    title,
    updatedAt: candidate.metadata.lastSeenAt,
    url: candidate.url,
  };
}

function hasConversationChanged(
  firstConversation: Conversation,
  secondConversation: Conversation,
): boolean {
  return (
    firstConversation.isActive !== secondConversation.isActive ||
    firstConversation.metadata.lastSeenAt !== secondConversation.metadata.lastSeenAt ||
    firstConversation.title !== secondConversation.title ||
    firstConversation.url !== secondConversation.url
  );
}
