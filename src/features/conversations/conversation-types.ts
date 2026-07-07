import type { EntityId, ISODateTimeString } from '@/shared/types';

export type ConversationStatus = 'error' | 'idle' | 'observing' | 'ready';

export interface ConversationMetadata {
  readonly detectedFrom: 'active-url' | 'conversation-list' | 'unknown';
  readonly lastSeenAt: ISODateTimeString;
}

export interface Conversation {
  readonly createdAt: ISODateTimeString;
  readonly favorite: boolean;
  readonly folderId: EntityId | null;
  readonly id: EntityId;
  readonly isActive: boolean;
  readonly isArchived: boolean;
  readonly metadata: ConversationMetadata;
  readonly tags: readonly EntityId[];
  readonly title: string;
  readonly updatedAt: ISODateTimeString;
  readonly url: string;
}

export interface ConversationCandidate {
  readonly id: EntityId;
  readonly isActive: boolean;
  readonly title: string;
  readonly url: string;
  readonly metadata: ConversationMetadata;
}

export interface ConversationSnapshot {
  readonly activeConversationId: EntityId | null;
  readonly conversations: readonly ConversationCandidate[];
  readonly capturedAt: ISODateTimeString;
  readonly conversationListObserved: boolean;
}

export interface ConversationState {
  readonly activeConversationId: EntityId | null;
  readonly conversations: readonly Conversation[];
  readonly error: Error | null;
  readonly status: ConversationStatus;
}

export interface ConversationDetectionContext {
  readonly document: Document;
  readonly location: Location;
  readonly now: () => Date;
}
