import { Semaphore } from '@/runtime/utils';

import type { WorkflowExecutor, WorkflowStartInput } from './workflow-executor';
import type { WorkflowExecution } from './workflow-types';

/** Schedules workflow executions with bounded concurrency. */
export class WorkflowScheduler {
  private readonly semaphore: Semaphore;

  public constructor(
    private readonly executor: WorkflowExecutor,
    maxConcurrentWorkflows = 4,
  ) {
    this.semaphore = new Semaphore(maxConcurrentWorkflows);
  }

  /** Enqueues and runs a workflow execution. */
  public async schedule(input: WorkflowStartInput): Promise<WorkflowExecution> {
    const permit = await this.semaphore.acquire();

    try {
      return await this.executor.start(input);
    } finally {
      await permit.dispose();
    }
  }
}
