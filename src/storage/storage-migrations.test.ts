import { describe, expect, it } from 'vitest';

import { DEFAULT_ENTITLEMENT_STATE } from '@/features/entitlements';
import { DEFAULT_SETTINGS } from '@/constants/settings';
import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION, type StorageKey } from '@/constants/storage';
import { migrateStorage } from '@/storage/storage-migrations';
import type {
  StorageChangeListener,
  StorageDriver,
  StorageUnsubscribe,
  StorageValue,
} from '@/storage/storage-driver';

class MemoryStorageDriver implements StorageDriver {
  public readonly values = new Map<StorageKey, StorageValue>();

  public constructor(initialValues: Readonly<Partial<Record<StorageKey, StorageValue>>> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.values.set(key as StorageKey, value);
    }
  }

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

describe('storage migrations', () => {
  it('creates baseline versioned settings and entitlements for legacy storage', async () => {
    const storage = new MemoryStorageDriver({
      [STORAGE_KEYS.settings]: {
        enableDebugLogging: true,
        sidebarWidth: 900,
      },
    });

    const result = await migrateStorage(storage);

    expect(result).toEqual({
      fromVersion: 0,
      migrated: true,
      toVersion: STORAGE_SCHEMA_VERSION,
    });
    expect(await storage.get(STORAGE_KEYS.schemaVersion)).toBe(STORAGE_SCHEMA_VERSION);
    expect(await storage.get(STORAGE_KEYS.settings)).toEqual({
      ...DEFAULT_SETTINGS,
      enableDebugLogging: true,
      sidebarWidth: 520,
    });
    expect(await storage.get(STORAGE_KEYS.entitlements)).toEqual(DEFAULT_ENTITLEMENT_STATE);
  });

  it('leaves current storage at the current schema version', async () => {
    const storage = new MemoryStorageDriver({
      [STORAGE_KEYS.schemaVersion]: STORAGE_SCHEMA_VERSION,
      [STORAGE_KEYS.settings]: DEFAULT_SETTINGS,
    });

    await expect(migrateStorage(storage)).resolves.toEqual({
      fromVersion: STORAGE_SCHEMA_VERSION,
      migrated: false,
      toVersion: STORAGE_SCHEMA_VERSION,
    });
  });

  it('normalizes signed-in account identity for Pro entitlements', async () => {
    const storage = new MemoryStorageDriver({
      [STORAGE_KEYS.entitlements]: {
        accountEmail: 'pro@example.com',
        accountId: 'acct_123',
        planId: 'pro',
        signedIn: true,
      },
    });

    await migrateStorage(storage);

    expect(await storage.get(STORAGE_KEYS.entitlements)).toEqual({
      accountEmail: 'pro@example.com',
      accountId: 'acct_123',
      billingPortalUrl: null,
      planId: 'pro',
      signedIn: true,
      subscriptionCheckedAt: null,
      subscriptionStatus: 'unknown',
    });
  });

  it('refuses storage written by a newer extension version', async () => {
    const storage = new MemoryStorageDriver({
      [STORAGE_KEYS.schemaVersion]: STORAGE_SCHEMA_VERSION + 1,
    });

    await expect(migrateStorage(storage)).rejects.toThrow(
      'Stored data was created by a newer version of ChatGPT Workspace.',
    );
  });
});
