import type { WorkflowStep, WorkflowStepHandler, WorkflowStepType } from './workflow-types';
import { WorkflowRuntimeError } from './workflow-types';

/** Registry of workflow step handlers, including plugin-contributed handlers. */
export class WorkflowStepRegistry {
  private readonly handlers = new Map<WorkflowStepType, WorkflowStepHandler>();

  /** Registers or replaces a step handler. */
  public register<Step extends WorkflowStep>(handler: WorkflowStepHandler<Step>): void {
    this.handlers.set(handler.type, handler);
  }

  /** Returns a registered step handler. */
  public get(type: WorkflowStepType): WorkflowStepHandler | undefined {
    return this.handlers.get(type);
  }

  /** Requires a registered step handler. */
  public require(type: WorkflowStepType): WorkflowStepHandler {
    const handler = this.get(type);

    if (handler === undefined) {
      throw new WorkflowRuntimeError(
        'WORKFLOW_STEP_FAILED',
        `No workflow step handler registered: ${type}`,
      );
    }

    return handler;
  }
}
