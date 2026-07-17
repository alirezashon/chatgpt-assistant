import { EXTENSION_ID_PREFIX } from '@/constants/app';

export const STORAGE_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  assignments: `${EXTENSION_ID_PREFIX}:assignments`,
  aiCache: `${EXTENSION_ID_PREFIX}:ai-cache`,
  aiHistory: `${EXTENSION_ID_PREFIX}:ai-history`,
  aiSettings: `${EXTENSION_ID_PREFIX}:ai-settings`,
  chats: `${EXTENSION_ID_PREFIX}:chats`,
  diagnostics: `${EXTENSION_ID_PREFIX}:diagnostics`,
  entitlements: `${EXTENSION_ID_PREFIX}:entitlements`,
  favorites: `${EXTENSION_ID_PREFIX}:favorites`,
  folders: `${EXTENSION_ID_PREFIX}:folders`,
  recentlyUsedFolders: `${EXTENSION_ID_PREFIX}:recently-used-folders`,
  schemaVersion: `${EXTENSION_ID_PREFIX}:schema-version`,
  searchHistory: `${EXTENSION_ID_PREFIX}:search-history`,
  selectedFolderId: `${EXTENSION_ID_PREFIX}:selected-folder-id`,
  settings: `${EXTENSION_ID_PREFIX}:settings`,
  syncSnapshot: `${EXTENSION_ID_PREFIX}:sync-snapshot`,
  tags: `${EXTENSION_ID_PREFIX}:tags`,
  tasks: `${EXTENSION_ID_PREFIX}:tasks`,
  uiPreferences: `${EXTENSION_ID_PREFIX}:ui-preferences`,
  upgradeEvents: `${EXTENSION_ID_PREFIX}:upgrade-events`,
  workspace: `${EXTENSION_ID_PREFIX}:workspace`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
