import { APP_NAME, APP_VERSION } from '@/constants/app';
import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION, type StorageKey } from '@/constants/storage';
import { migrateStorage } from '@/storage/storage-migrations';
import type { StorageDriver, StorageValue } from '@/storage/storage-driver';

export const LOCAL_WORKSPACE_BACKUP_KIND = 'chatgpt-workspace.local-backup';

export const BACKUP_STORAGE_KEYS = [
  STORAGE_KEYS.assignments,
  STORAGE_KEYS.chats,
  STORAGE_KEYS.favorites,
  STORAGE_KEYS.folders,
  STORAGE_KEYS.recentlyUsedFolders,
  STORAGE_KEYS.schemaVersion,
  STORAGE_KEYS.searchHistory,
  STORAGE_KEYS.selectedFolderId,
  STORAGE_KEYS.settings,
  STORAGE_KEYS.syncSnapshot,
  STORAGE_KEYS.tags,
  STORAGE_KEYS.uiPreferences,
  STORAGE_KEYS.workspace,
] as const satisfies readonly StorageKey[];

export type BackupStorageKey = (typeof BACKUP_STORAGE_KEYS)[number];

export interface LocalWorkspaceBackup {
  readonly appName: string;
  readonly appVersion: string;
  readonly exportedAt: string;
  readonly kind: typeof LOCAL_WORKSPACE_BACKUP_KIND;
  readonly schemaVersion: number;
  readonly storage: Readonly<Partial<Record<BackupStorageKey, StorageValue>>>;
}

export async function createLocalWorkspaceBackup(
  storage: StorageDriver,
  now: () => Date = () => new Date(),
): Promise<LocalWorkspaceBackup> {
  const storedValues = await storage.getMany(BACKUP_STORAGE_KEYS);
  const backupValues: Partial<Record<BackupStorageKey, StorageValue>> = {};

  for (const key of BACKUP_STORAGE_KEYS) {
    const value = storedValues[key];

    if (value !== undefined) {
      backupValues[key] = value;
    }
  }

  return {
    appName: APP_NAME,
    appVersion: APP_VERSION,
    exportedAt: now().toISOString(),
    kind: LOCAL_WORKSPACE_BACKUP_KIND,
    schemaVersion: STORAGE_SCHEMA_VERSION,
    storage: backupValues,
  };
}

export async function restoreLocalWorkspaceBackup(
  storage: StorageDriver,
  backup: LocalWorkspaceBackup,
): Promise<void> {
  const backupValues: Partial<Record<StorageKey, StorageValue>> = {};

  for (const [key, value] of Object.entries(backup.storage)) {
    backupValues[key as StorageKey] = value;
  }

  await Promise.all(BACKUP_STORAGE_KEYS.map((key) => storage.remove(key)));
  await storage.setMany(backupValues);
  await migrateStorage(storage);
}

export function parseLocalWorkspaceBackupText(text: string): LocalWorkspaceBackup {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Backup file is not valid JSON.');
  }

  return parseLocalWorkspaceBackup(value);
}

export function parseLocalWorkspaceBackup(value: unknown): LocalWorkspaceBackup {
  if (!isRecord(value)) {
    throw new Error('Backup file is empty or invalid.');
  }

  if (value['kind'] !== LOCAL_WORKSPACE_BACKUP_KIND) {
    throw new Error('This file is not a ChatGPT Workspace backup.');
  }

  const schemaVersion = value['schemaVersion'];

  if (!Number.isInteger(schemaVersion) || typeof schemaVersion !== 'number' || schemaVersion < 0) {
    throw new Error('Backup file has an invalid schema version.');
  }

  if (schemaVersion > STORAGE_SCHEMA_VERSION) {
    throw new Error('Backup file was created by a newer version of ChatGPT Workspace.');
  }

  const storageValues = value['storage'];

  if (!isRecord(storageValues)) {
    throw new Error('Backup file does not include workspace storage.');
  }

  const allowedKeys = new Set<string>(BACKUP_STORAGE_KEYS);
  const backupStorage: Partial<Record<BackupStorageKey, StorageValue>> = {};

  for (const [key, storageValue] of Object.entries(storageValues)) {
    if (!allowedKeys.has(key)) {
      throw new Error('Backup file includes unsupported storage data.');
    }

    backupStorage[key as BackupStorageKey] = storageValue;
  }

  return {
    appName: typeof value['appName'] === 'string' ? value['appName'] : APP_NAME,
    appVersion: typeof value['appVersion'] === 'string' ? value['appVersion'] : APP_VERSION,
    exportedAt: typeof value['exportedAt'] === 'string' ? value['exportedAt'] : '',
    kind: LOCAL_WORKSPACE_BACKUP_KIND,
    schemaVersion,
    storage: backupStorage,
  };
}

export function stringifyLocalWorkspaceBackup(backup: LocalWorkspaceBackup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
