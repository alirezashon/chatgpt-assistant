import type { EntityId, ISODateTimeString, Tag } from '@/shared/types';

export interface ConversationTagAssignment {
  readonly conversationId: EntityId;
  readonly tagId: EntityId;
}

export interface TagStorageState {
  readonly assignments: readonly ConversationTagAssignment[];
  readonly tags: readonly Tag[];
}

export interface CreateTagInput {
  readonly color?: string;
  readonly name: string;
}

export interface RenameTagInput {
  readonly id: EntityId;
  readonly name: string;
}

export interface TagModelInput {
  readonly color?: string;
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly name: string;
}
