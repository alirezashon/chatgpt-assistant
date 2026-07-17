import type { RecoveryManager } from '@/app/synchronization/recovery-manager';
import type { SyncConfig } from '@/app/synchronization/sync-config';
import { DEFAULT_UI_PREFERENCES } from '@/app/synchronization/sync-config';
import type { SyncEvents } from '@/app/synchronization/sync-events';
import { syncStore } from '@/app/synchronization/sync-state';
import type { WorkspaceSnapshot } from '@/app/synchronization/sync-types';
import {
  createSnapshotSignature,
  isExtensionContextInvalidatedError,
  toSyncError,
} from '@/app/synchronization/sync-utils';
import type { StorageSnapshotManager } from '@/app/synchronization/storage-snapshot-manager';
import { createWorkspaceSnapshot } from '@/app/synchronization/workspace-snapshot';
import { workspaceStore } from '@/app/workspace/workspace-state';
import { assignmentStore } from '@/features/assignments';
import { conversationStore } from '@/features/conversations';
import { folderStore } from '@/features/folders';
import type { Logger } from '@/shared/logger';

interface PersistenceManagerOptions {
  readonly config: SyncConfig;
  readonly events: SyncEvents;
  readonly logger: Logger;
  readonly recoveryManager: RecoveryManager;
  readonly snapshotManager: StorageSnapshotManager;
}

export class PersistenceManager {
  private readonly config: SyncConfig;
  private readonly events: SyncEvents;
  private readonly logger: Logger;
  private readonly recoveryManager: RecoveryManager;
  private readonly snapshotManager: StorageSnapshotManager;
  private lastPersistedSignature: string | null = null;
  private restoring = false;

  public constructor(options: PersistenceManagerOptions) {
    this.config = options.config;
    this.events = options.events;
    this.logger = options.logger;
    this.recoveryManager = options.recoveryManager;
    this.snapshotManager = options.snapshotManager;
  }

  public isRestoring(): boolean {
    return this.restoring;
  }

  public async restore(): Promise<WorkspaceSnapshot | null> {
    this.events.emit('syncStarted', undefined);
    syncStore.setState({
      error: null,
      status: 'restoring',
    });

    try {
      const snapshot = await this.snapshotManager.loadSnapshot();

      if (snapshot === null) {
        syncStore.setState({
          error: null,
          status: 'idle',
        });

        return null;
      }

      const resolution = this.recoveryManager.recover(snapshot);
      const recoveredSnapshot = resolution.recoveredSnapshot;

      this.applySnapshot(recoveredSnapshot);
      this.lastPersistedSignature = createSnapshotSignature(recoveredSnapshot);
      await this.snapshotManager.saveSnapshot(recoveredSnapshot);

      this.rememberSnapshot(recoveredSnapshot, 'idle');
      this.events.emit('workspaceRestored', {
        snapshot: recoveredSnapshot,
      });
      this.events.emit('syncCompleted', {
        snapshot: recoveredSnapshot,
      });

      return recoveredSnapshot;
    } catch (error) {
      if (isExtensionContextInvalidatedError(error)) {
        syncStore.setState({
          error: new Error('Extension was reloaded. Refresh this ChatGPT tab to reconnect.'),
          status: 'idle',
        });
        this.logger.warn('Workspace restore paused because the extension context was reloaded.');

        return null;
      }

      const syncError = toSyncError(error);

      syncStore.setState({
        error: syncError,
        status: 'error',
      });
      this.events.emit('syncFailed', {
        error: syncError,
      });
      this.logger.error('Workspace restore failed.', syncError);

      return null;
    }
  }

  public async persistCurrentSnapshot(): Promise<WorkspaceSnapshot | null> {
    if (this.restoring) {
      return null;
    }

    const snapshot = createWorkspaceSnapshot(syncStore.getState().uiPreferences);
    const signature = createSnapshotSignature(snapshot);

    if (signature === this.lastPersistedSignature) {
      return snapshot;
    }

    this.events.emit('syncStarted', undefined);
    syncStore.setState({
      error: null,
      status: 'syncing',
    });

    try {
      await this.snapshotManager.saveSnapshot(snapshot);
      this.lastPersistedSignature = signature;
      this.rememberSnapshot(snapshot, 'idle');
      this.events.emit('snapshotCreated', {
        snapshot,
      });
      this.events.emit('syncCompleted', {
        snapshot,
      });

      return snapshot;
    } catch (error) {
      if (isExtensionContextInvalidatedError(error)) {
        syncStore.setState({
          error: new Error('Extension was reloaded. Refresh this ChatGPT tab to reconnect.'),
          status: 'idle',
        });
        this.logger.warn(
          'Workspace persistence paused because the extension context was reloaded.',
        );

        return null;
      }

      const syncError = toSyncError(error);

      syncStore.setState({
        error: syncError,
        status: 'error',
      });
      this.events.emit('syncFailed', {
        error: syncError,
      });
      this.logger.error('Workspace persistence failed.', syncError);
      throw syncError;
    }
  }

  private applySnapshot(snapshot: WorkspaceSnapshot): void {
    this.restoring = true;

    try {
      const folders = {
        ...snapshot.folders,
        error: null,
        status: 'ready',
      } as const;
      const assignments = {
        ...snapshot.assignments,
        error: null,
        status: 'ready',
      } as const;
      const conversations = {
        ...snapshot.conversations,
        error: null,
        status: 'ready',
      } as const;

      folderStore.replaceState(folders);
      assignmentStore.replaceState(assignments);
      conversationStore.replaceState(conversations);
      workspaceStore.replaceState({
        ...snapshot.workspace,
        assignments,
        conversations,
        error: null,
        folders,
        lifecycle: 'boot',
      });
      syncStore.setState({
        error: null,
        uiPreferences: {
          ...DEFAULT_UI_PREFERENCES,
          ...snapshot.uiPreferences,
        },
      });
    } finally {
      this.restoring = false;
    }
  }

  private rememberSnapshot(snapshot: WorkspaceSnapshot, status: 'idle' | 'syncing'): void {
    const history = [snapshot, ...syncStore.getState().snapshotHistory]
      .filter((candidate, index, snapshots) => {
        return snapshots.findIndex((item) => item.id === candidate.id) === index;
      })
      .slice(0, this.config.maxSnapshotHistory);

    syncStore.setState({
      error: null,
      lastSnapshot: snapshot,
      lastSyncedAt: new Date().toISOString(),
      snapshotHistory: history,
      status,
      uiPreferences: {
        ...DEFAULT_UI_PREFERENCES,
        ...snapshot.uiPreferences,
      },
    });
  }
}
