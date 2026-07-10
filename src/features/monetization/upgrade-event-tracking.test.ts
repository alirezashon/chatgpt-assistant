import { describe, expect, it } from 'vitest';

import type { StorageKey } from '@/constants/storage';
import {
  appendUpgradeEvent,
  readUpgradeEvents,
} from '@/features/monetization/upgrade-event-tracking';
import type { StorageChangeListener, StorageDriver, StorageValue } from '@/storage';

describe('upgrade event tracking', () => {
  it('stores local upgrade events for later backend sync', async () => {
    const storage = new MemoryStorageDriver();

    await appendUpgradeEvent(
      storage,
      {
        featureId: 'priority-support-diagnostics',
        metadata: {
          source: 'button',
        },
        name: 'upgrade-clicked',
        surface: 'options',
      },
      () => new Date('2026-07-10T00:00:00.000Z'),
      () => 'upgrade-1',
    );

    await expect(readUpgradeEvents(storage)).resolves.toEqual([
      {
        createdAt: '2026-07-10T00:00:00.000Z',
        featureId: 'priority-support-diagnostics',
        id: 'upgrade-1',
        metadata: {
          source: 'button',
        },
        name: 'upgrade-clicked',
        surface: 'options',
      },
    ]);
  });
});

class MemoryStorageDriver implements StorageDriver {
  private readonly values = new Map<string, StorageValue>();

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
    return Promise.resolve(
      Object.fromEntries(
        keys.map((key) => [key, this.values.get(key) as Value | undefined]),
      ) as Record<StorageKey, Value | undefined>,
    );
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
      this.values.set(key, value);
    }

    return Promise.resolve();
  }

  public subscribe(listener: StorageChangeListener): () => void {
    void listener;

    return () => undefined;
  }
}
