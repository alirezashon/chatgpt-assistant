import type { DistributedEvent } from './distributed-types';
import { DistributedRuntimeError } from './distributed-types';

/** Security policy for publishing and replaying distributed events. */
export class EventSecurityManager {
  private readonly allowedSourcesByType = new Map<string, Set<string>>();
  private readonly replayWindowMs: number;

  public constructor(replayWindowMs = 5 * 60 * 1000) {
    this.replayWindowMs = replayWindowMs;
  }

  /** Allows source to publish an event type. */
  public allowSource(type: string, source: string): void {
    const sources = this.allowedSourcesByType.get(type) ?? new Set<string>();
    sources.add(source);
    this.allowedSourcesByType.set(type, sources);
  }

  /** Validates publish permissions, organization scope, and replay window. */
  public assertCanPublish(event: DistributedEvent): void {
    const allowed = this.allowedSourcesByType.get(event.type);

    if (allowed !== undefined && !allowed.has(event.source)) {
      throw new DistributedRuntimeError('DISTRIBUTED_SECURITY_DENIED', 'Event source is not allowed to publish this type.', {
        source: event.source,
        type: event.type,
      });
    }

    if (event.security.identityId.trim().length === 0 || event.security.permissions.length === 0) {
      throw new DistributedRuntimeError('DISTRIBUTED_SECURITY_DENIED', 'Event is missing identity or permission context.');
    }

    if (Math.abs(Date.now() - event.timestamp) > this.replayWindowMs) {
      throw new DistributedRuntimeError('DISTRIBUTED_REPLAY_REJECTED', 'Event timestamp is outside replay window.');
    }
  }
}
