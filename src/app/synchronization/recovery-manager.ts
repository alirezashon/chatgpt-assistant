import { ConflictResolver } from '@/app/synchronization/conflict-resolver';
import type { SyncEvents } from '@/app/synchronization/sync-events';
import type { ConflictResolution, WorkspaceSnapshot } from '@/app/synchronization/sync-types';

export class RecoveryManager {
  private readonly conflictResolver: ConflictResolver;
  private readonly events: SyncEvents;

  public constructor(
    events: SyncEvents,
    conflictResolver: ConflictResolver = new ConflictResolver(),
  ) {
    this.conflictResolver = conflictResolver;
    this.events = events;
  }

  public recover(snapshot: WorkspaceSnapshot): ConflictResolution {
    const resolution = this.conflictResolver.resolve(snapshot);

    if (resolution.conflicts.length > 0) {
      this.events.emit('recoveryStarted', {
        conflicts: resolution.conflicts,
      });
      this.events.emit('recoveryCompleted', {
        conflicts: resolution.conflicts,
        snapshot: resolution.recoveredSnapshot,
      });
    }

    return resolution;
  }
}
