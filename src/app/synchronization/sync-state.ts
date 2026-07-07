import { createStore } from '@/state';
import { DEFAULT_UI_PREFERENCES } from '@/app/synchronization/sync-config';
import type { SyncState } from '@/app/synchronization/sync-types';

export const initialSyncState: SyncState = {
  error: null,
  lastSnapshot: null,
  lastSyncedAt: null,
  snapshotHistory: [],
  status: 'idle',
  uiPreferences: DEFAULT_UI_PREFERENCES,
};

export const syncStore = createStore<SyncState>(initialSyncState);
