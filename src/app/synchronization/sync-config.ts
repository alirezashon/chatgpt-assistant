import type { UiPreferences } from '@/app/synchronization/sync-types';

export interface SyncConfig {
  readonly debounceMs: number;
  readonly maxSnapshotHistory: number;
  readonly queueThrottleMs: number;
  readonly schemaVersion: number;
}

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  expandedFolderIds: [],
  recentlyUsedFolderIds: [],
  sidebarOpen: false,
};

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  debounceMs: 250,
  maxSnapshotHistory: 20,
  queueThrottleMs: 50,
  schemaVersion: 1,
};
