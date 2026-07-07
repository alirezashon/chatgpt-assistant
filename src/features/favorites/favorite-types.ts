import type { EntityId, ISODateTimeString } from '@/shared/types';

export type FavoriteStatus = 'error' | 'idle' | 'loading' | 'ready' | 'saving';

export interface ConversationFavorite {
  readonly conversationId: EntityId;
  readonly createdAt: ISODateTimeString;
  readonly groupId: EntityId | null;
}

export interface FavoriteState {
  readonly error: Error | null;
  readonly favorites: readonly ConversationFavorite[];
  readonly status: FavoriteStatus;
}

export interface ToggleFavoriteInput {
  readonly conversationId: EntityId;
}
