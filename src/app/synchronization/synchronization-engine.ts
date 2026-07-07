import { PersistenceManager } from '@/app/synchronization/persistence-manager';
import { RecoveryManager } from '@/app/synchronization/recovery-manager';
import { DEFAULT_SYNC_CONFIG, type SyncConfig } from '@/app/synchronization/sync-config';
import {
  SyncEvents,
  type SyncEventListener,
  type SyncEventName,
  type SyncEventUnsubscribe,
} from '@/app/synchronization/sync-events';
import { SyncQueue } from '@/app/synchronization/sync-queue';
import { syncStore } from '@/app/synchronization/sync-state';
import type { UiPreferences } from '@/app/synchronization/sync-types';
import { SynchronizationCoordinator } from '@/app/synchronization/synchronization-coordinator';
import { StorageSnapshotManager } from '@/app/synchronization/storage-snapshot-manager';
import { logger as defaultLogger, type Logger } from '@/shared/logger';
import { ChromeStorageDriver, type StorageDriver } from '@/storage';

interface SynchronizationEngineOptions {
  readonly config?: SyncConfig;
  readonly events?: SyncEvents;
  readonly logger?: Logger;
  readonly storage: StorageDriver;
}

export class SynchronizationEngine {
  private readonly coordinator: SynchronizationCoordinator;
  private readonly events: SyncEvents;

  public constructor(options: SynchronizationEngineOptions) {
    const config = options.config ?? DEFAULT_SYNC_CONFIG;
    const events = options.events ?? new SyncEvents();
    const logger = options.logger ?? defaultLogger;
    const snapshotManager = new StorageSnapshotManager(options.storage);
    const recoveryManager = new RecoveryManager(events);
    const persistenceManager = new PersistenceManager({
      config,
      events,
      logger,
      recoveryManager,
      snapshotManager,
    });
    const queue = new SyncQueue(config.queueThrottleMs);

    this.coordinator = new SynchronizationCoordinator({
      config,
      logger,
      persistenceManager,
      queue,
      storage: options.storage,
    });
    this.events = events;
  }

  public async start(): Promise<void> {
    await this.coordinator.start();
  }

  public stop(): void {
    this.coordinator.stop();
  }

  public requestSync(): void {
    this.coordinator.requestSync();
  }

  public async syncNow(): Promise<void> {
    await this.coordinator.syncNow();
  }

  public updateUiPreferences(patch: Partial<UiPreferences>): void {
    syncStore.setState((currentState) => ({
      uiPreferences: {
        ...currentState.uiPreferences,
        ...patch,
      },
    }));
    this.requestSync();
  }

  public subscribe<EventName extends SyncEventName>(
    eventName: EventName,
    listener: SyncEventListener<EventName>,
  ): SyncEventUnsubscribe {
    return this.events.subscribe(eventName, listener);
  }
}

let synchronizationEngine: SynchronizationEngine | null = null;

export function configureSynchronizationEngine(engine: SynchronizationEngine): void {
  synchronizationEngine = engine;
}

export function createSynchronizationEngine(storage: StorageDriver): SynchronizationEngine {
  return new SynchronizationEngine({
    storage,
  });
}

export function getSynchronizationEngine(): SynchronizationEngine {
  synchronizationEngine ??= new SynchronizationEngine({
    storage: new ChromeStorageDriver(),
  });

  return synchronizationEngine;
}
