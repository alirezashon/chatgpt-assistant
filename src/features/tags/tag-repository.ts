import { STORAGE_KEYS } from '@/constants/storage';
import type { ConversationTagAssignment, TagStorageState } from '@/features/tags/tag-types';
import type { Tag } from '@/shared/types';
import type { StorageDriver, StorageUnsubscribe } from '@/storage';

export interface TagRepository {
  getState(): Promise<TagStorageState>;
  saveState(state: TagStorageState): Promise<void>;
  subscribe(listener: () => void): StorageUnsubscribe;
}

export class StorageTagRepository implements TagRepository {
  private readonly storage: StorageDriver;

  public constructor(storage: StorageDriver) {
    this.storage = storage;
  }

  public async getState(): Promise<TagStorageState> {
    const value = await this.storage.get(STORAGE_KEYS.tags);

    if (!isTagStorageState(value)) {
      return {
        assignments: [],
        tags: [],
      };
    }

    return value;
  }

  public async saveState(state: TagStorageState): Promise<void> {
    await this.storage.set(STORAGE_KEYS.tags, state);
  }

  public subscribe(listener: () => void): StorageUnsubscribe {
    return this.storage.subscribe((changes) => {
      if (changes.some((change) => change.key === STORAGE_KEYS.tags)) {
        listener();
      }
    });
  }
}

function isTagStorageState(value: unknown): value is TagStorageState {
  if (!isRecord(value) || !Array.isArray(value['tags']) || !Array.isArray(value['assignments'])) {
    return false;
  }

  return value['tags'].every(isTag) && value['assignments'].every(isConversationTagAssignment);
}

function isTag(value: unknown): value is Tag {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['createdAt'] === 'string' &&
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['updatedAt'] === 'string' &&
    (value['color'] === undefined || typeof value['color'] === 'string')
  );
}

function isConversationTagAssignment(value: unknown): value is ConversationTagAssignment {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value['conversationId'] === 'string' && typeof value['tagId'] === 'string';
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
