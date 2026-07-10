import type { PersistenceManager } from '@/app/synchronization/persistence-manager';
import type { SyncConfig } from '@/app/synchronization/sync-config';
import type { SyncQueue } from '@/app/synchronization/sync-queue';
import { syncStore } from '@/app/synchronization/sync-state';
import { workspaceStore } from '@/app/workspace/workspace-state';
import { STORAGE_KEYS, type StorageKey } from '@/constants/storage';
import { assignmentStore } from '@/features/assignments';
import { conversationStore } from '@/features/conversations';
import { folderStore } from '@/features/folders';
import type { Logger } from '@/shared/logger';
import type { Unsubscribe } from '@/state';
import type { StorageDriver, StorageUnsubscribe } from '@/storage';

const WATCHED_STORAGE_KEYS = new Set<StorageKey>([
  STORAGE_KEYS.assignments,
  STORAGE_KEYS.folders,
  STORAGE_KEYS.selectedFolderId,
  STORAGE_KEYS.syncSnapshot,
  STORAGE_KEYS.uiPreferences,
  STORAGE_KEYS.workspace,
]);

interface SynchronizationCoordinatorOptions {
  readonly config: SyncConfig;
  readonly logger: Logger;
  readonly persistenceManager: PersistenceManager;
  readonly queue: SyncQueue;
  readonly storage: StorageDriver;
}

export class SynchronizationCoordinator {
  private readonly config: SyncConfig;
  private debounceTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private readonly logger: Logger;
  private readonly persistenceManager: PersistenceManager;
  private readonly queue: SyncQueue;
  private started = false;
  private readonly storage: StorageDriver;
  private storageUnsubscribe: StorageUnsubscribe | null = null;
  private readonly unsubscribers: Unsubscribe[] = [];

  public constructor(options: SynchronizationCoordinatorOptions) {
    this.config = options.config;
    this.logger = options.logger;
    this.persistenceManager = options.persistenceManager;
    this.queue = options.queue;
    this.storage = options.storage;
  }

  public async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    await this.persistenceManager.restore();
    this.subscribeToRuntimeState();
    this.subscribeToStorage();
  }

  public stop(): void {
    this.started = false;
    this.clearDebounceTimer();
    this.storageUnsubscribe?.();
    this.storageUnsubscribe = null;

    while (this.unsubscribers.length > 0) {
      this.unsubscribers.pop()?.();
    }
  }

  public requestSync(): void {
    if (!this.started || this.persistenceManager.isRestoring()) {
      return;
    }

    this.clearDebounceTimer();
    this.debounceTimer = globalThis.setTimeout(() => {
      this.enqueuePersistence();
    }, this.config.debounceMs);
  }

  public async syncNow(): Promise<void> {
    this.clearDebounceTimer();
    await this.persistenceManager.persistCurrentSnapshot();
  }

  private enqueuePersistence(): void {
    this.queue.enqueue({
      run: async () => {
        try {
          await this.persistenceManager.persistCurrentSnapshot();
        } catch (error) {
          this.logger.error('Queued synchronization task failed.', error);
        }
      },
    });
  }

  private subscribeToRuntimeState(): void {
    const scheduleSync = () => {
      this.requestSync();
    };

    this.unsubscribers.push(
      assignmentStore.subscribe(scheduleSync),
      conversationStore.subscribe(scheduleSync),
      folderStore.subscribe(scheduleSync),
      workspaceStore.subscribe(scheduleSync),
    );
  }

  private subscribeToStorage(): void {
    this.storageUnsubscribe = this.storage.subscribe((changes) => {
      if (!this.started || this.persistenceManager.isRestoring()) {
        return;
      }

      const relevantChange = changes.find((change) => WATCHED_STORAGE_KEYS.has(change.key));

      if (relevantChange === undefined) {
        return;
      }

      if (relevantChange.key === STORAGE_KEYS.syncSnapshot) {
        const snapshotId = readSnapshotId(relevantChange.newValue);
        const lastSnapshotId = syncStore.getState().lastSnapshot?.id ?? null;

        if (snapshotId !== null && snapshotId !== lastSnapshotId) {
          void this.persistenceManager.restore();
        }

        return;
      }

      this.requestSync();
    });
  }

  private clearDebounceTimer(): void {
    if (this.debounceTimer === null) {
      return;
    }

    globalThis.clearTimeout(this.debounceTimer);
    this.debounceTimer = null;
  }
}

function readSnapshotId(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return typeof candidate['id'] === 'string' ? candidate['id'] : null;
}
