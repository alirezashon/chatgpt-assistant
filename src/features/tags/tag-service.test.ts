import { describe, expect, it } from 'vitest';

import { STORAGE_KEYS, type StorageKey } from '@/constants/storage';
import { DefaultTagService } from '@/features/tags/tag-service';
import { StorageTagRepository } from '@/features/tags/tag-repository';
import type {
  StorageChangeListener,
  StorageDriver,
  StorageUnsubscribe,
  StorageValue,
} from '@/storage';

class MemoryStorageDriver implements StorageDriver {
  public readonly values = new Map<StorageKey, StorageValue>();

  public clear(): Promise<void> {
    this.values.clear();

    return Promise.resolve();
  }

  public get<Value = StorageValue>(key: StorageKey): Promise<Value | undefined> {
    return Promise.resolve(this.values.get(key) as Value | undefined);
  }

  public getMany<Value = StorageValue>(
    keys: readonly StorageKey[],
  ): Promise<Readonly<Record<StorageKey, Value | undefined>>> {
    const result: Partial<Record<StorageKey, Value | undefined>> = {};

    for (const key of keys) {
      result[key] = this.values.get(key) as Value | undefined;
    }

    return Promise.resolve(result as Readonly<Record<StorageKey, Value | undefined>>);
  }

  public remove(key: StorageKey): Promise<void> {
    this.values.delete(key);

    return Promise.resolve();
  }

  public set(key: StorageKey, value: StorageValue): Promise<void> {
    this.values.set(key, value);

    return Promise.resolve();
  }

  public setMany(values: Readonly<Partial<Record<StorageKey, StorageValue>>>): Promise<void> {
    for (const [key, value] of Object.entries(values)) {
      this.values.set(key as StorageKey, value);
    }

    return Promise.resolve();
  }

  public subscribe(listener: StorageChangeListener): StorageUnsubscribe {
    void listener;

    return () => {
      // Memory test storage has no change stream.
    };
  }
}

describe('tag service', () => {
  it('creates, renames, assigns, unassigns, and deletes tags', async () => {
    const storage = new MemoryStorageDriver();
    const service = new DefaultTagService({
      clock: () => new Date('2026-07-10T10:00:00.000Z'),
      idGenerator: () => 'tag-1',
      repository: new StorageTagRepository(storage),
    });

    const tag = await service.createTag({
      color: '#0f766e',
      name: ' Client  Work ',
    });

    expect(tag).toEqual({
      color: '#0f766e',
      createdAt: '2026-07-10T10:00:00.000Z',
      id: 'tag-1',
      name: 'Client Work',
      updatedAt: '2026-07-10T10:00:00.000Z',
    });

    await service.assignTag('conversation-1', 'tag-1');
    await service.assignTag('conversation-1', 'tag-1');
    expect(await service.getConversationTagIds('conversation-1')).toEqual(['tag-1']);

    await service.renameTag({
      id: 'tag-1',
      name: 'Client Launch',
    });
    expect((await service.listTags())[0]?.name).toBe('Client Launch');

    await service.unassignTag('conversation-1', 'tag-1');
    expect(await service.getConversationTagIds('conversation-1')).toEqual([]);

    await service.assignTag('conversation-1', 'tag-1');
    await service.deleteTag('tag-1');
    expect(await service.getState()).toEqual({
      assignments: [],
      tags: [],
    });
    expect(storage.values.get(STORAGE_KEYS.tags)).toEqual({
      assignments: [],
      tags: [],
    });
  });

  it('rejects duplicate tag names', async () => {
    const service = new DefaultTagService({
      idGenerator: () => crypto.randomUUID(),
      repository: new StorageTagRepository(new MemoryStorageDriver()),
    });

    await service.createTag({ name: 'Research' });

    await expect(service.createTag({ name: ' research ' })).rejects.toThrow(
      'Tag name already exists.',
    );
  });
});
