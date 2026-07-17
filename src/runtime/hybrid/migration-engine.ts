import type { ExecutionRequest, HybridValue, MigrationRecord, RuntimeTarget } from './hybrid-types';

/** Migrates execution sessions by checkpointing and resuming on another runtime. */
export class MigrationEngine {
  private readonly migrations: MigrationRecord[] = [];
  private readonly checkpoints = new Map<string, HybridValue>();

  /** Checkpoints a request. */
  public checkpoint(key: string, value: HybridValue): void {
    this.checkpoints.set(key, value);
  }

  /** Migrates request to another target. */
  public migrate(input: {
    readonly from: RuntimeTarget;
    readonly reason: string;
    readonly request: ExecutionRequest;
    readonly to: RuntimeTarget;
  }): MigrationRecord {
    const checkpointKey = input.request.checkpointKey ?? `checkpoint:${input.request.id}`;
    this.checkpoint(checkpointKey, input.request.input);
    const record: MigrationRecord = {
      checkpointKey,
      from: input.from,
      id: crypto.randomUUID(),
      reason: input.reason,
      requestId: input.request.id,
      timestamp: Date.now(),
      to: input.to,
    };
    this.migrations.push(record);
    return record;
  }

  /** Resumes checkpoint. */
  public resume(checkpointKey: string): HybridValue | undefined {
    return this.checkpoints.get(checkpointKey);
  }

  /** Lists migrations. */
  public list(): readonly MigrationRecord[] {
    return this.migrations;
  }
}
