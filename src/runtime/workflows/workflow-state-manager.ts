import type {
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowStepExecutionState,
  WorkflowTimelineEvent,
  WorkflowValue,
} from './workflow-types';
import type { WorkflowStateStore } from './workflow-state-store';

/** Manages persisted workflow execution mutations. */
export class WorkflowStateManager {
  public constructor(private readonly store: WorkflowStateStore) {}

  /** Saves an execution. */
  public save(execution: WorkflowExecution): Promise<void> {
    return this.store.saveExecution(execution);
  }

  /** Reads an execution. */
  public get(executionId: string): Promise<WorkflowExecution | undefined> {
    return this.store.getExecution(executionId);
  }

  /** Lists executions. */
  public list(): Promise<readonly WorkflowExecution[]> {
    return this.store.listExecutions();
  }

  /** Updates execution status. */
  public async setStatus(
    execution: WorkflowExecution,
    status: WorkflowExecutionStatus,
    now = Date.now(),
  ): Promise<WorkflowExecution> {
    const next = {
      ...execution,
      status,
      updatedAt: now,
    };
    await this.save(next);
    return next;
  }

  /** Records a timeline event. */
  public async appendTimeline(
    execution: WorkflowExecution,
    event: Omit<WorkflowTimelineEvent, 'id' | 'timestamp'>,
    now = Date.now(),
  ): Promise<WorkflowExecution> {
    const next = {
      ...execution,
      timeline: [
        ...execution.timeline,
        {
          ...event,
          id: crypto.randomUUID(),
          timestamp: now,
        },
      ],
      updatedAt: now,
    };
    await this.save(next);
    return next;
  }

  /** Writes step state. */
  public async setStep(
    execution: WorkflowExecution,
    stepState: WorkflowStepExecutionState,
    now = Date.now(),
  ): Promise<WorkflowExecution> {
    const next = {
      ...execution,
      currentStepId: stepState.stepId,
      steps: {
        ...execution.steps,
        [stepState.stepId]: stepState,
      },
      updatedAt: now,
    };
    await this.save(next);
    return next;
  }

  /** Writes step output. */
  public async setOutput(
    execution: WorkflowExecution,
    stepId: string,
    output: WorkflowValue,
    now = Date.now(),
  ): Promise<WorkflowExecution> {
    const next = {
      ...execution,
      outputs: {
        ...execution.outputs,
        [stepId]: output,
      },
      updatedAt: now,
    };
    await this.save(next);
    return next;
  }
}
