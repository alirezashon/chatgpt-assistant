import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import {
  getSynchronizationEngine,
  type SynchronizationEngine,
} from '@/app/synchronization/synchronization-engine';
import type { SyncEventListener, SyncEventName } from '@/app/synchronization/sync-events';
import { syncStore } from '@/app/synchronization/sync-state';
import type { SyncState, UiPosition, UiPreferences } from '@/app/synchronization/sync-types';

export interface SyncActions {
  readonly markRecentlyUsedFolder: (folderId: string) => void;
  readonly requestSync: () => void;
  readonly setFloatingButtonPosition: (position: UiPosition) => void;
  readonly setSidebarOpen: (sidebarOpen: boolean) => void;
  readonly setSidebarWidth: (sidebarWidth: number) => void;
  readonly toggleExpandedFolder: (folderId: string) => void;
  readonly updateUiPreferences: (patch: Partial<UiPreferences>) => void;
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (listener) => syncStore.subscribe(listener),
    () => syncStore.getState(),
    () => syncStore.getState(),
  );
}

export function useUiPreferences(): UiPreferences {
  return useSyncState().uiPreferences;
}

export function useSyncActions(
  engine: SynchronizationEngine = getSynchronizationEngine(),
): SyncActions {
  const updateUiPreferences = useCallback(
    (patch: Partial<UiPreferences>) => {
      engine.updateUiPreferences(patch);
    },
    [engine],
  );

  const requestSync = useCallback(() => {
    engine.requestSync();
  }, [engine]);

  const setSidebarOpen = useCallback(
    (sidebarOpen: boolean) => {
      updateUiPreferences({
        sidebarOpen,
      });
    },
    [updateUiPreferences],
  );

  const setSidebarWidth = useCallback(
    (sidebarWidth: number) => {
      updateUiPreferences({
        sidebarWidth,
      });
    },
    [updateUiPreferences],
  );

  const setFloatingButtonPosition = useCallback(
    (position: UiPosition) => {
      updateUiPreferences({
        floatingButtonPosition: position,
      });
    },
    [updateUiPreferences],
  );

  const toggleExpandedFolder = useCallback(
    (folderId: string) => {
      const currentPreferences = syncStore.getState().uiPreferences;
      const expandedFolderIds = new Set(currentPreferences.expandedFolderIds);

      if (expandedFolderIds.has(folderId)) {
        expandedFolderIds.delete(folderId);
      } else {
        expandedFolderIds.add(folderId);
      }

      updateUiPreferences({
        expandedFolderIds: [...expandedFolderIds],
      });
    },
    [updateUiPreferences],
  );

  const markRecentlyUsedFolder = useCallback(
    (folderId: string) => {
      const currentPreferences = syncStore.getState().uiPreferences;
      const recentlyUsedFolderIds = [
        folderId,
        ...currentPreferences.recentlyUsedFolderIds.filter(
          (recentFolderId) => recentFolderId !== folderId,
        ),
      ].slice(0, 10);

      updateUiPreferences({
        recentlyUsedFolderIds,
      });
    },
    [updateUiPreferences],
  );

  return useMemo(
    () => ({
      markRecentlyUsedFolder,
      requestSync,
      setFloatingButtonPosition,
      setSidebarOpen,
      setSidebarWidth,
      toggleExpandedFolder,
      updateUiPreferences,
    }),
    [
      markRecentlyUsedFolder,
      requestSync,
      setFloatingButtonPosition,
      setSidebarOpen,
      setSidebarWidth,
      toggleExpandedFolder,
      updateUiPreferences,
    ],
  );
}

export function useSyncEvent<EventName extends SyncEventName>(
  eventName: EventName,
  listener: SyncEventListener<EventName>,
  engine: SynchronizationEngine = getSynchronizationEngine(),
): void {
  useEffect(() => {
    return engine.subscribe(eventName, listener);
  }, [engine, eventName, listener]);
}
