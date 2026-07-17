import type { EventBus } from '@/runtime/events';

import type {
  WorkflowCheckpoint,
  WorkflowExecution,
  WorkflowRuntimeEvents,
} from './workflow-types';
import type { WorkflowStateStore } from './workflow-state-store';

/** Creates and persists workflow recovery checkpoints. */
export class WorkflowCheckpointManager {
  public constructor(
    private readonly store: WorkflowStateStore,
    private readonly events: EventBus<WorkflowRuntimeEvents>,
  ) {}

  /** Saves a checkpoint for an execution. */
  public async checkpoint(
    execution: WorkflowExecution,
    now = Date.now(),
  ): Promise<WorkflowCheckpoint> {
    const checkpoint: WorkflowCheckpoint = {
      execution,
      executionId: execution.id,
      id: crypto.randomUUID(),
      timestamp: now,
    };
    await this.store.saveCheckpoint(checkpoint);
    await this.events.emit('workflow.checkpointed', checkpoint);
    return checkpoint;
  }

  /** Lists checkpoints for an execution. */
  public list(executionId: string): Promise<readonly WorkflowCheckpoint[]> {
    return this.store.listCheckpoints(executionId);
  }
}
