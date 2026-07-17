import type { WorkflowExecutor } from './workflow-executor';
import type { WorkflowRegistry } from './workflow-registry';
import type { WorkflowStateManager } from './workflow-state-manager';
import type { WorkflowExecution } from './workflow-types';

/** Recovers persisted workflow executions after browser or service-worker restart. */
export class WorkflowRecoveryManager {
  public constructor(
    private readonly registry: WorkflowRegistry,
    private readonly state: WorkflowStateManager,
    private readonly executor: WorkflowExecutor,
  ) {}

  /** Resumes recoverable executions and leaves approval-blocked executions paused in place. */
  public async recover(): Promise<readonly WorkflowExecution[]> {
    const executions = await this.state.list();
    const recovered: WorkflowExecution[] = [];

    for (const execution of executions) {
      if (execution.status === 'waiting-approval') {
        recovered.push(execution);
        continue;
      }

      if (
        execution.status !== 'pending' &&
        execution.status !== 'running' &&
        execution.status !== 'paused'
      ) {
        continue;
      }

      const workflow = this.registry.require(execution.workflowId);
      recovered.push(await this.executor.resume(workflow, execution));
    }

    return recovered;
  }
}
