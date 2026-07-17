import type { StorageDriver } from '@/runtime/storage';

import type { WorkflowCheckpoint, WorkflowExecution } from './workflow-types';

const EXECUTION_INDEX_KEY = 'workflow:executions:index';
const CHECKPOINT_INDEX_KEY = 'workflow:checkpoints:index';

/** Persisted workflow state store. */
export interface WorkflowStateStore {
  /** Saves an execution. */
  saveExecution(execution: WorkflowExecution): Promise<void>;
  /** Reads an execution. */
  getExecution(executionId: string): Promise<WorkflowExecution | undefined>;
  /** Lists executions. */
  listExecutions(): Promise<readonly WorkflowExecution[]>;
  /** Deletes an execution. */
  deleteExecution(executionId: string): Promise<void>;
  /** Saves a checkpoint. */
  saveCheckpoint(checkpoint: WorkflowCheckpoint): Promise<void>;
  /** Lists checkpoints for an execution. */
  listCheckpoints(executionId: string): Promise<readonly WorkflowCheckpoint[]>;
}

/** In-memory workflow state store for tests and volatile sessions. */
export class MemoryWorkflowStateStore implements WorkflowStateStore {
  private readonly executions = new Map<string, WorkflowExecution>();
  private readonly checkpoints = new Map<string, WorkflowCheckpoint[]>();

  /** Saves an execution. */
  public saveExecution(execution: WorkflowExecution): Promise<void> {
    this.executions.set(execution.id, execution);
    return Promise.resolve();
  }

  /** Reads an execution. */
  public getExecution(executionId: string): Promise<WorkflowExecution | undefined> {
    return Promise.resolve(this.executions.get(executionId));
  }

  /** Lists executions. */
  public listExecutions(): Promise<readonly WorkflowExecution[]> {
    return Promise.resolve([...this.executions.values()]);
  }

  /** Deletes an execution. */
  public deleteExecution(executionId: string): Promise<void> {
    this.executions.delete(executionId);
    this.checkpoints.delete(executionId);
    return Promise.resolve();
  }

  /** Saves a checkpoint. */
  public saveCheckpoint(checkpoint: WorkflowCheckpoint): Promise<void> {
    const items = this.checkpoints.get(checkpoint.executionId) ?? [];
    this.checkpoints.set(checkpoint.executionId, [...items, checkpoint]);
    return Promise.resolve();
  }

  /** Lists checkpoints for an execution. */
  public listCheckpoints(executionId: string): Promise<readonly WorkflowCheckpoint[]> {
    return Promise.resolve(this.checkpoints.get(executionId) ?? []);
  }
}

/** Storage-driver-backed workflow state store for Chrome storage or IndexedDB adapters. */
export class DriverWorkflowStateStore implements WorkflowStateStore {
  public constructor(private readonly driver: StorageDriver) {}

  /** Saves an execution and updates the execution index. */
  public async saveExecution(execution: WorkflowExecution): Promise<void> {
    const ids = await this.readIndex(EXECUTION_INDEX_KEY);
    const nextIds = ids.includes(execution.id) ? ids : [...ids, execution.id];
    await this.driver.set({
      [EXECUTION_INDEX_KEY]: nextIds,
      [executionKey(execution.id)]: execution,
    });
  }

  /** Reads an execution. */
  public async getExecution(executionId: string): Promise<WorkflowExecution | undefined> {
    const values = await this.driver.get([executionKey(executionId)]);
    const value = values[executionKey(executionId)];
    return isWorkflowExecution(value) ? value : undefined;
  }

  /** Lists executions. */
  public async listExecutions(): Promise<readonly WorkflowExecution[]> {
    const ids = await this.readIndex(EXECUTION_INDEX_KEY);
    const values = await this.driver.get(ids.map(executionKey));
    return ids
      .map((id) => values[executionKey(id)])
      .filter((value): value is WorkflowExecution => isWorkflowExecution(value));
  }

  /** Deletes an execution. */
  public async deleteExecution(executionId: string): Promise<void> {
    const ids = await this.readIndex(EXECUTION_INDEX_KEY);
    await this.driver.set({
      [EXECUTION_INDEX_KEY]: ids.filter((id) => id !== executionId),
    });
    await this.driver.remove([executionKey(executionId)]);
  }

  /** Saves a checkpoint and updates the checkpoint index. */
  public async saveCheckpoint(checkpoint: WorkflowCheckpoint): Promise<void> {
    const ids = await this.readIndex(CHECKPOINT_INDEX_KEY);
    const nextIds = ids.includes(checkpoint.id) ? ids : [...ids, checkpoint.id];
    await this.driver.set({
      [CHECKPOINT_INDEX_KEY]: nextIds,
      [checkpointKey(checkpoint.id)]: checkpoint,
    });
  }

  /** Lists checkpoints for an execution. */
  public async listCheckpoints(executionId: string): Promise<readonly WorkflowCheckpoint[]> {
    const ids = await this.readIndex(CHECKPOINT_INDEX_KEY);
    const values = await this.driver.get(ids.map(checkpointKey));
    return ids
      .map((id) => values[checkpointKey(id)])
      .filter((value): value is WorkflowCheckpoint => isWorkflowCheckpoint(value))
      .filter((checkpoint) => checkpoint.executionId === executionId);
  }

  private async readIndex(key: string): Promise<readonly string[]> {
    const values = await this.driver.get([key]);
    const value = values[key];
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
  }
}

function executionKey(executionId: string): string {
  return `workflow:execution:${executionId}`;
}

function checkpointKey(checkpointId: string): string {
  return `workflow:checkpoint:${checkpointId}`;
}

function isWorkflowExecution(value: unknown): value is WorkflowExecution {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { readonly id?: unknown }).id === 'string' &&
    typeof (value as { readonly workflowId?: unknown }).workflowId === 'string'
  );
}

function isWorkflowCheckpoint(value: unknown): value is WorkflowCheckpoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { readonly id?: unknown }).id === 'string' &&
    typeof (value as { readonly executionId?: unknown }).executionId === 'string' &&
    isWorkflowExecution((value as { readonly execution?: unknown }).execution)
  );
}
