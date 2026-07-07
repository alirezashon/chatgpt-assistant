import type { SyncConflict, WorkspaceSnapshot } from '@/app/synchronization/sync-types';

export interface SyncEventMap {
  readonly recoveryCompleted: {
    readonly conflicts: readonly SyncConflict[];
    readonly snapshot: WorkspaceSnapshot;
  };
  readonly recoveryStarted: {
    readonly conflicts: readonly SyncConflict[];
  };
  readonly snapshotCreated: {
    readonly snapshot: WorkspaceSnapshot;
  };
  readonly syncCompleted: {
    readonly snapshot: WorkspaceSnapshot;
  };
  readonly syncFailed: {
    readonly error: Error;
  };
  readonly syncStarted: undefined;
  readonly workspaceRestored: {
    readonly snapshot: WorkspaceSnapshot;
  };
}

export type SyncEventName = keyof SyncEventMap;
export type SyncEventListener<EventName extends SyncEventName> = (
  payload: SyncEventMap[EventName],
) => void;
export type SyncEventUnsubscribe = () => void;

export class SyncEvents {
  private readonly listeners = new Map<SyncEventName, Set<(payload: unknown) => void>>();

  public emit<EventName extends SyncEventName>(
    eventName: EventName,
    payload: SyncEventMap[EventName],
  ): void {
    const eventListeners = this.listeners.get(eventName);

    if (eventListeners === undefined) {
      return;
    }

    for (const listener of eventListeners) {
      listener(payload);
    }
  }

  public subscribe<EventName extends SyncEventName>(
    eventName: EventName,
    listener: SyncEventListener<EventName>,
  ): SyncEventUnsubscribe {
    const eventListeners = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    const wrappedListener = (payload: unknown) => {
      listener(payload as SyncEventMap[EventName]);
    };

    eventListeners.add(wrappedListener);
    this.listeners.set(eventName, eventListeners);

    return () => {
      eventListeners.delete(wrappedListener);
    };
  }
}
