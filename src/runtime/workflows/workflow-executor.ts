import type { EventBus } from '@/runtime/events';
import { retry } from '@/runtime/utils';

import { WorkflowConditionEngine } from './workflow-condition-engine';
import type { WorkflowCheckpointManager } from './workflow-checkpoint-manager';
import type { WorkflowPermissionManager } from './workflow-permission-manager';
import type { WorkflowStateManager } from './workflow-state-manager';
import type { WorkflowStepRegistry } from './workflow-step-registry';
import type {
  WorkflowApprovalDecision,
  WorkflowApprovalRequest,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionContext,
  WorkflowRuntimeEvents,
  WorkflowStep,
  WorkflowStepExecutionState,
  WorkflowStepResult,
  WorkflowValue,
} from './workflow-types';
import { WorkflowRuntimeError } from './workflow-types';
import type { WorkflowValidator } from './workflow-validator';

/** Executes workflow definitions with persistence, retries, checkpoints, and approvals. */
export class WorkflowExecutor {
  public constructor(
    private readonly steps: WorkflowStepRegistry,
    private readonly state: WorkflowStateManager,
    private readonly checkpoints: WorkflowCheckpointManager,
    private readonly permissions: WorkflowPermissionManager,
    private readonly validator: WorkflowValidator,
    private readonly events: EventBus<WorkflowRuntimeEvents>,
    private readonly conditions = new WorkflowConditionEngine(),
  ) {}

  /** Creates an execution record and runs it. */
  public async start(input: WorkflowStartInput): Promise<WorkflowExecution> {
    const variables = this.validator.validateVariables(input.workflow, input.variables);
    const now = Date.now();
    let execution: WorkflowExecution = {
      context: input.context,
      createdAt: now,
      dryRun: input.dryRun,
      id: crypto.randomUUID(),
      outputs: {},
      status: 'pending',
      steps: {},
      timeline: [],
      trigger: input.trigger,
      updatedAt: now,
      variables,
      workflowId: input.workflow.id,
      workflowVersion: input.workflow.version,
    };

    await this.state.save(execution);
    execution = await this.state.appendTimeline(execution, {
      message: `Workflow ${input.workflow.id} started.`,
      type: 'workflow.started',
    });
    await this.events.emit('workflow.started', {
      executionId: execution.id,
      workflowId: input.workflow.id,
    });
    await this.checkpoints.checkpoint(execution);

    return this.resume(input.workflow, execution);
  }

  /** Resumes an execution from persisted state. */
  public async resume(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
  ): Promise<WorkflowExecution> {
    if (execution.status === 'waiting-approval') {
      return execution;
    }

    let running = await this.state.setStatus(execution, 'running');
    running = await this.runSteps(
      workflow,
      running,
      workflow.steps,
      this.getResumeAfterStepId(workflow, running),
    );

    if (running.status === 'running') {
      running = await this.state.setStatus(running, 'succeeded');
      running = await this.state.appendTimeline(running, {
        message: `Workflow ${workflow.id} completed.`,
        type: 'workflow.completed',
      });
      await this.events.emit('workflow.completed', {
        executionId: running.id,
        status: 'succeeded',
      });
      await this.checkpoints.checkpoint(running);
    }

    return running;
  }

  /** Applies a human approval decision and continues execution. */
  public async approve(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    decision: WorkflowApprovalDecision,
  ): Promise<WorkflowExecution> {
    if (
      execution.waitingApprovalId !== decision.approvalId ||
      execution.currentStepId === undefined
    ) {
      throw new WorkflowRuntimeError(
        'WORKFLOW_WAITING_APPROVAL',
        `Execution is not waiting for approval: ${execution.id}`,
      );
    }

    if (decision.decision === 'rejected') {
      const failed = await this.state.setStatus(execution, 'failed');
      await this.events.emit('workflow.failed', {
        executionId: failed.id,
        message: decision.comment ?? 'Approval rejected.',
      });
      return failed;
    }

    const output: WorkflowValue = {
      approved: true,
      comment: decision.comment ?? null,
      modifiedInput: decision.modifiedInput ?? null,
    };
    let next = await this.state.setStep(execution, {
      attempts: (execution.steps[execution.currentStepId]?.attempts ?? 0) + 1,
      output,
      status: 'succeeded',
      stepId: execution.currentStepId,
    });
    next = await this.state.setOutput(next, execution.currentStepId, output);
    const resumed: WorkflowExecution = {
      context: next.context,
      createdAt: next.createdAt,
      ...(next.currentStepId === undefined ? {} : { currentStepId: next.currentStepId }),
      dryRun: next.dryRun,
      id: next.id,
      outputs: next.outputs,
      steps: next.steps,
      timeline: next.timeline,
      trigger: next.trigger,
      updatedAt: next.updatedAt,
      variables: next.variables,
      workflowId: next.workflowId,
      workflowVersion: next.workflowVersion,
      status: 'running',
    };
    await this.state.save(resumed);
    await this.checkpoints.checkpoint(resumed);

    return this.resume(workflow, resumed);
  }

  /** Executes nested steps for compound handlers without mutating parent persisted state. */
  public async executeNested(
    steps: readonly WorkflowStep[],
    context: WorkflowExecutionContext,
  ): Promise<WorkflowExecutionContext> {
    let nextContext = context;

    for (const step of steps) {
      if (step.condition !== undefined && !this.conditions.evaluate(step.condition, nextContext)) {
        continue;
      }

      const result = await this.steps.require(step.type).execute(step, nextContext);

      if (result.status === 'failed') {
        throw new WorkflowRuntimeError(
          'WORKFLOW_STEP_FAILED',
          result.error ?? `Nested step failed: ${step.id}`,
        );
      }

      if (result.output !== undefined) {
        nextContext = {
          ...nextContext,
          outputs: {
            ...nextContext.outputs,
            [step.id]: result.output,
          },
        };
      }
    }

    return nextContext;
  }

  private async runSteps(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    steps: readonly WorkflowStep[],
    startAfterStepId?: string,
  ): Promise<WorkflowExecution> {
    let running = execution;
    let shouldRun = startAfterStepId === undefined;

    for (const step of steps) {
      if (!shouldRun) {
        shouldRun = step.id === startAfterStepId;
        continue;
      }

      running = await this.executeStep(workflow, running, step);

      if (running.status !== 'running') {
        return running;
      }
    }

    return running;
  }

  private async executeStep(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    step: WorkflowStep,
  ): Promise<WorkflowExecution> {
    this.permissions.assertStepAllowed(workflow, step);

    const context = this.createContext(workflow, execution);

    if (step.condition !== undefined && !this.conditions.evaluate(step.condition, context)) {
      return this.markStep(execution, step.id, {
        attempts: 0,
        status: 'skipped',
        stepId: step.id,
      });
    }

    let running = await this.state.appendTimeline(execution, {
      message: `Step ${step.id} started.`,
      stepId: step.id,
      type: 'workflow.stepStarted',
    });
    await this.events.emit('workflow.stepStarted', { executionId: running.id, stepId: step.id });

    const policy = step.retryPolicy ?? workflow.retryPolicy;

    try {
      const result = await retry(async (attempt) => {
        running = await this.markStep(running, step.id, {
          attempts: attempt,
          status: 'running',
          stepId: step.id,
        });
        return this.executeStepOnce(step, this.createContext(workflow, running));
      }, policy);

      return await this.applyStepResult(workflow, running, step, result, policy.maxAttempts);
    } catch (error) {
      return this.handleStepFailure(workflow, running, step, error, policy.maxAttempts);
    }
  }

  private async executeStepOnce(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowStepResult> {
    const handler = this.steps.require(step.type);
    return handler.execute(step, context);
  }

  private async applyStepResult(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    step: WorkflowStep,
    result: WorkflowStepResult,
    attempts: number,
  ): Promise<WorkflowExecution> {
    if (result.status === 'waiting') {
      return this.waitForApproval(execution, step, result);
    }

    if (result.status === 'failed') {
      return this.handleStepFailure(
        workflow,
        execution,
        step,
        result.error ?? 'Step failed.',
        attempts,
      );
    }

    let next = await this.markStep(execution, step.id, {
      attempts,
      ...(result.error === undefined ? {} : { error: result.error }),
      ...(result.output === undefined ? {} : { output: result.output }),
      status: result.status,
      stepId: step.id,
    });

    if (result.output !== undefined) {
      next = await this.state.setOutput(next, step.id, result.output);
    }

    next = await this.state.appendTimeline(next, {
      message: `Step ${step.id} ${result.status}.`,
      stepId: step.id,
      type: 'workflow.stepCompleted',
    });
    await this.events.emit('workflow.stepCompleted', {
      executionId: next.id,
      status: result.status,
      stepId: step.id,
    });
    await this.checkpoints.checkpoint(next);
    return next;
  }

  private async waitForApproval(
    execution: WorkflowExecution,
    step: WorkflowStep,
    result: WorkflowStepResult,
  ): Promise<WorkflowExecution> {
    if (step.type !== 'human-approval' || result.approvalId === undefined) {
      throw new WorkflowRuntimeError(
        'WORKFLOW_STEP_FAILED',
        `Step cannot wait for approval: ${step.id}`,
      );
    }

    const request: WorkflowApprovalRequest = {
      createdAt: Date.now(),
      executionId: execution.id,
      id: result.approvalId,
      prompt: step.prompt,
      risk: step.risk,
      stepId: step.id,
    };
    const next: WorkflowExecution = {
      ...execution,
      currentStepId: step.id,
      status: 'waiting-approval',
      updatedAt: Date.now(),
      waitingApprovalId: request.id,
    };
    await this.state.save(next);
    const timelineExecution = await this.state.appendTimeline(next, {
      message: `Step ${step.id} waiting for approval.`,
      stepId: step.id,
      type: 'workflow.approvalRequested',
    });
    await this.events.emit('workflow.approvalRequested', request);
    await this.checkpoints.checkpoint(timelineExecution);
    return timelineExecution;
  }

  private async handleStepFailure(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    step: WorkflowStep,
    error: unknown,
    attempts: number,
  ): Promise<WorkflowExecution> {
    const message = error instanceof Error ? error.message : String(error);
    const strategy = step.errorStrategy ?? workflow.errorStrategy;

    if (strategy === 'skip') {
      return this.markStep(execution, step.id, {
        attempts,
        error: message,
        status: 'skipped',
        stepId: step.id,
      });
    }

    let failed = await this.markStep(execution, step.id, {
      attempts,
      error: message,
      status: 'failed',
      stepId: step.id,
    });
    failed = await this.state.setStatus(failed, 'failed');
    failed = await this.state.appendTimeline(failed, {
      message,
      stepId: step.id,
      type: 'workflow.failed',
    });
    await this.events.emit('workflow.failed', {
      executionId: failed.id,
      message,
    });
    await this.checkpoints.checkpoint(failed);
    return failed;
  }

  private async markStep(
    execution: WorkflowExecution,
    stepId: string,
    state: WorkflowStepExecutionState,
  ): Promise<WorkflowExecution> {
    return this.state.setStep(execution, {
      ...state,
      stepId,
    });
  }

  private createContext(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
  ): WorkflowExecutionContext {
    return {
      context: execution.context,
      dryRun: execution.dryRun,
      executionId: execution.id,
      outputs: execution.outputs,
      trigger: execution.trigger,
      variables: execution.variables,
      workflow,
    };
  }

  private getResumeAfterStepId(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
  ): string | undefined {
    if (execution.currentStepId === undefined) {
      return undefined;
    }

    const current = execution.steps[execution.currentStepId];

    if (current?.status === 'succeeded' || current?.status === 'skipped') {
      return execution.currentStepId;
    }

    const currentIndex = workflow.steps.findIndex((step) => step.id === execution.currentStepId);

    if (currentIndex <= 0) {
      return undefined;
    }

    return workflow.steps[currentIndex - 1]?.id;
  }
}

/** Input used to start a workflow execution. */
export interface WorkflowStartInput {
  /** Workflow definition. */
  readonly workflow: WorkflowDefinition;
  /** Trigger event. */
  readonly trigger: WorkflowExecution['trigger'];
  /** Workflow variables. */
  readonly variables: Readonly<Record<string, WorkflowValue>>;
  /** Context values. */
  readonly context: Readonly<Record<string, WorkflowValue>>;
  /** Dry run mode. */
  readonly dryRun: boolean;
}
