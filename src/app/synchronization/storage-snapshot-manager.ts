import { STORAGE_KEYS } from '@/constants/storage';
import type { StorageDriver } from '@/storage';
import type { WorkspaceSnapshot } from '@/app/synchronization/sync-types';
import { isWorkspaceSnapshot } from '@/app/synchronization/workspace-snapshot';

export class StorageSnapshotManager {
  private readonly storage: StorageDriver;

  public constructor(storage: StorageDriver) {
    this.storage = storage;
  }

  public async loadSnapshot(): Promise<WorkspaceSnapshot | null> {
    const snapshot = await this.storage.get(STORAGE_KEYS.syncSnapshot);

    return isWorkspaceSnapshot(snapshot) ? snapshot : null;
  }

  public async saveSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
    await this.storage.setMany({
      [STORAGE_KEYS.assignments]: snapshot.assignments.assignments,
      [STORAGE_KEYS.folders]: snapshot.folders.folders,
      [STORAGE_KEYS.recentlyUsedFolders]: snapshot.uiPreferences.recentlyUsedFolderIds,
      [STORAGE_KEYS.selectedFolderId]: snapshot.folders.selectedFolderId,
      [STORAGE_KEYS.syncSnapshot]: snapshot,
      [STORAGE_KEYS.uiPreferences]: snapshot.uiPreferences,
      [STORAGE_KEYS.workspace]: snapshot.workspace.workspace,
    });
  }
}
