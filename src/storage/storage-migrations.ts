import { DEFAULT_ENTITLEMENT_STATE, type EntitlementState } from '@/features/entitlements';
import { DEFAULT_SETTINGS } from '@/constants/settings';
import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION } from '@/constants/storage';
import type { StorageDriver, StorageValue } from '@/storage/storage-driver';
import type { WorkspaceSettings } from '@/shared/types';

export interface StorageMigrationResult {
  readonly fromVersion: number;
  readonly migrated: boolean;
  readonly toVersion: number;
}

interface StorageMigration {
  readonly toVersion: number;
  run(storage: StorageDriver): Promise<void>;
}

const STORAGE_MIGRATIONS: readonly StorageMigration[] = [
  {
    async run(storage) {
      const [settings, entitlements] = await Promise.all([
        storage.get(STORAGE_KEYS.settings),
        storage.get(STORAGE_KEYS.entitlements),
      ]);

      await storage.setMany({
        [STORAGE_KEYS.settings]: normalizeWorkspaceSettings(settings),
        [STORAGE_KEYS.entitlements]: normalizeEntitlementState(entitlements),
      });
    },
    toVersion: 1,
  },
];

export async function migrateStorage(storage: StorageDriver): Promise<StorageMigrationResult> {
  const storedVersion = await storage.get(STORAGE_KEYS.schemaVersion);
  const fromVersion = normalizeSchemaVersion(storedVersion);

  if (fromVersion > STORAGE_SCHEMA_VERSION) {
    throw new Error('Stored data was created by a newer version of ChatGPT Workspace.');
  }

  let currentVersion = fromVersion;
  let migrated = false;

  for (const migration of STORAGE_MIGRATIONS) {
    if (migration.toVersion <= currentVersion) {
      continue;
    }

    await migration.run(storage);
    await storage.set(STORAGE_KEYS.schemaVersion, migration.toVersion);
    currentVersion = migration.toVersion;
    migrated = true;
  }

  if (currentVersion < STORAGE_SCHEMA_VERSION) {
    throw new Error('No storage migration path is available for the current data.');
  }

  if (!migrated && storedVersion !== STORAGE_SCHEMA_VERSION) {
    await storage.set(STORAGE_KEYS.schemaVersion, STORAGE_SCHEMA_VERSION);
  }

  return {
    fromVersion,
    migrated,
    toVersion: STORAGE_SCHEMA_VERSION,
  };
}

function normalizeSchemaVersion(value: StorageValue): number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0 ? value : 0;
}

function normalizeWorkspaceSettings(value: StorageValue): WorkspaceSettings {
  if (!isRecord(value)) {
    return DEFAULT_SETTINGS;
  }

  return {
    enableDebugLogging:
      typeof value['enableDebugLogging'] === 'boolean'
        ? value['enableDebugLogging']
        : DEFAULT_SETTINGS.enableDebugLogging,
    schemaVersion: STORAGE_SCHEMA_VERSION,
    sidebarWidth:
      typeof value['sidebarWidth'] === 'number'
        ? clampSidebarWidth(value['sidebarWidth'])
        : DEFAULT_SETTINGS.sidebarWidth,
    theme:
      value['theme'] === 'light' || value['theme'] === 'system'
        ? value['theme']
        : DEFAULT_SETTINGS.theme,
  };
}

function normalizeEntitlementState(value: StorageValue): EntitlementState {
  if (!isRecord(value)) {
    return DEFAULT_ENTITLEMENT_STATE;
  }

  const planId = value['planId'] === 'pro' ? 'pro' : DEFAULT_ENTITLEMENT_STATE.planId;
  const signedIn = planId === 'pro' && value['signedIn'] === true;
  const accountEmail =
    signedIn && typeof value['accountEmail'] === 'string' ? value['accountEmail'] : null;

  return {
    accountEmail,
    planId,
    signedIn,
  };
}

function clampSidebarWidth(value: number): number {
  return Math.min(520, Math.max(320, Math.round(value)));
}

function isRecord(value: StorageValue): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
