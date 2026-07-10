import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from '@/constants/settings';
import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION, type StorageKey } from '@/constants/storage';
import {
  LOCAL_WORKSPACE_BACKUP_KIND,
  createLocalWorkspaceBackup,
  parseLocalWorkspaceBackupText,
  restoreLocalWorkspaceBackup,
  stringifyLocalWorkspaceBackup,
} from '@/storage/storage-backup';
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

describe('storage backups', () => {
  it('exports local workspace data without account or AI settings', async () => {
    const storage = new MemoryStorageDriver({
      [STORAGE_KEYS.aiSettings]: { apiKey: 'secret' },
      [STORAGE_KEYS.entitlements]: { accountEmail: 'paid@example.com', planId: 'pro' },
      [STORAGE_KEYS.folders]: [{ id: 'folder-1', name: 'Research' }],
      [STORAGE_KEYS.schemaVersion]: STORAGE_SCHEMA_VERSION,
      [STORAGE_KEYS.settings]: DEFAULT_SETTINGS,
    });

    const backup = await createLocalWorkspaceBackup(
      storage,
      () => new Date('2026-07-10T10:00:00.000Z'),
    );

    expect(backup).toMatchObject({
      exportedAt: '2026-07-10T10:00:00.000Z',
      kind: LOCAL_WORKSPACE_BACKUP_KIND,
      schemaVersion: STORAGE_SCHEMA_VERSION,
    });
    expect(backup.storage[STORAGE_KEYS.folders]).toEqual([{ id: 'folder-1', name: 'Research' }]);
    expect(Object.hasOwn(backup.storage, STORAGE_KEYS.entitlements)).toBe(false);
    expect(Object.hasOwn(backup.storage, STORAGE_KEYS.aiSettings)).toBe(false);
  });

  it('round-trips a backup JSON file and restores only backup-managed keys', async () => {
    const backupStorage = new MemoryStorageDriver({
      [STORAGE_KEYS.folders]: [{ id: 'folder-1', name: 'Research' }],
      [STORAGE_KEYS.schemaVersion]: STORAGE_SCHEMA_VERSION,
      [STORAGE_KEYS.settings]: DEFAULT_SETTINGS,
    });
    const backup = await createLocalWorkspaceBackup(backupStorage);
    const targetStorage = new MemoryStorageDriver({
      [STORAGE_KEYS.entitlements]: { accountEmail: 'paid@example.com', planId: 'pro' },
      [STORAGE_KEYS.folders]: [{ id: 'old-folder', name: 'Old' }],
      [STORAGE_KEYS.selectedFolderId]: 'old-folder',
    });

    await restoreLocalWorkspaceBackup(
      targetStorage,
      parseLocalWorkspaceBackupText(stringifyLocalWorkspaceBackup(backup)),
    );

    expect(await targetStorage.get(STORAGE_KEYS.folders)).toEqual([
      { id: 'folder-1', name: 'Research' },
    ]);
    expect(await targetStorage.get(STORAGE_KEYS.selectedFolderId)).toBeUndefined();
    expect(await targetStorage.get(STORAGE_KEYS.settings)).toEqual(DEFAULT_SETTINGS);
    expect(await targetStorage.get(STORAGE_KEYS.schemaVersion)).toBe(STORAGE_SCHEMA_VERSION);
    expect(await targetStorage.get(STORAGE_KEYS.entitlements)).toEqual({
      accountEmail: 'paid@example.com',
      planId: 'pro',
    });
  });

  it('rejects unsupported backup files', () => {
    expect(() => parseLocalWorkspaceBackupText('not-json')).toThrow(
      'Backup file is not valid JSON.',
    );
    expect(() =>
      parseLocalWorkspaceBackupText(
        JSON.stringify({
          kind: 'something-else',
        }),
      ),
    ).toThrow('This file is not a ChatGPT Workspace backup.');
    expect(() =>
      parseLocalWorkspaceBackupText(
        JSON.stringify({
          kind: LOCAL_WORKSPACE_BACKUP_KIND,
          schemaVersion: STORAGE_SCHEMA_VERSION,
          storage: {
            'unsupported-key': true,
          },
        }),
      ),
    ).toThrow('Backup file includes unsupported storage data.');
  });
});
