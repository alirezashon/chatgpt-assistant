import { EventBus } from '@/runtime/events';

import { WorkflowCheckpointManager } from './workflow-checkpoint-manager';
import { WorkflowExecutor } from './workflow-executor';
import { WorkflowPermissionManager } from './workflow-permission-manager';
import { WorkflowRecoveryManager } from './workflow-recovery-manager';
import { WorkflowRegistry } from './workflow-registry';
import { WorkflowScheduler } from './workflow-scheduler';
import { WorkflowStateManager } from './workflow-state-manager';
import { MemoryWorkflowStateStore, type WorkflowStateStore } from './workflow-state-store';
import { createStandardWorkflowStepHandlers } from './workflow-standard-handlers';
import { WorkflowStepRegistry } from './workflow-step-registry';
import { WorkflowTriggerRegistry } from './workflow-trigger-registry';
import type {
  WorkflowAIGateway,
  WorkflowApiGateway,
  WorkflowApprovalDecision,
  WorkflowBrowserGateway,
  WorkflowCommandGateway,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowPlanner,
  WorkflowPluginGateway,
  WorkflowRuntimeEvents,
  WorkflowStepHandler,
  WorkflowSubWorkflowGateway,
  WorkflowTriggerEvent,
  WorkflowValue,
} from './workflow-types';
import { WorkflowRuntimeError } from './workflow-types';
import { WorkflowValidator } from './workflow-validator';

/** Workflow runtime host dependencies. */
export interface WorkflowRuntimeDependencies {
  /** State store. */
  readonly store?: WorkflowStateStore;
  /** Event bus. */
  readonly events?: EventBus<WorkflowRuntimeEvents>;
  /** Maximum active workflow executions. */
  readonly maxConcurrentWorkflows?: number;
  /** Command gateway. */
  readonly command?: WorkflowCommandGateway;
  /** AI gateway. */
  readonly ai?: WorkflowAIGateway;
  /** API gateway. */
  readonly api?: WorkflowApiGateway;
  /** Browser gateway. */
  readonly browser?: WorkflowBrowserGateway;
  /** Plugin gateway. */
  readonly plugin?: WorkflowPluginGateway;
  /** Sub-workflow gateway. */
  readonly subWorkflow?: WorkflowSubWorkflowGateway;
  /** Future planner gateway. */
  readonly planner?: WorkflowPlanner;
}

/** Headless workflow automation runtime. */
export class WorkflowRuntime {
  /** Workflow event bus. */
  public readonly events: EventBus<WorkflowRuntimeEvents>;
  /** Workflow registry. */
  public readonly registry: WorkflowRegistry;
  /** Step handler registry. */
  public readonly steps: WorkflowStepRegistry;

  private readonly triggers = new WorkflowTriggerRegistry();
  private readonly state: WorkflowStateManager;
  private readonly checkpoints: WorkflowCheckpointManager;
  private readonly executor: WorkflowExecutor;
  private readonly scheduler: WorkflowScheduler;
  private readonly recovery: WorkflowRecoveryManager;
  private readonly planner: WorkflowPlanner | undefined;

  public constructor(dependencies: WorkflowRuntimeDependencies = {}) {
    this.events = dependencies.events ?? new EventBus<WorkflowRuntimeEvents>();
    this.registry = new WorkflowRegistry();
    this.steps = new WorkflowStepRegistry();
    const store = dependencies.store ?? new MemoryWorkflowStateStore();
    this.state = new WorkflowStateManager(store);
    this.checkpoints = new WorkflowCheckpointManager(store, this.events);

    const validator = new WorkflowValidator();
    this.executor = new WorkflowExecutor(
      this.steps,
      this.state,
      this.checkpoints,
      new WorkflowPermissionManager(),
      validator,
      this.events,
    );
    this.scheduler = new WorkflowScheduler(this.executor, dependencies.maxConcurrentWorkflows ?? 4);
    this.recovery = new WorkflowRecoveryManager(this.registry, this.state, this.executor);
    this.planner = dependencies.planner;

    for (const handler of createStandardWorkflowStepHandlers({
      ...(dependencies.ai === undefined ? {} : { ai: dependencies.ai }),
      ...(dependencies.api === undefined ? {} : { api: dependencies.api }),
      ...(dependencies.browser === undefined ? {} : { browser: dependencies.browser }),
      ...(dependencies.command === undefined ? {} : { command: dependencies.command }),
      executeSteps: (steps, context) => this.executor.executeNested(steps, context),
      ...(dependencies.plugin === undefined ? {} : { plugin: dependencies.plugin }),
      ...(dependencies.subWorkflow === undefined ? {} : { subWorkflow: dependencies.subWorkflow }),
    })) {
      this.steps.register(handler);
    }
  }

  /** Registers a workflow definition. */
  public registerWorkflow(definition: WorkflowDefinition): void {
    this.registry.register(definition);
  }

  /** Registers a custom or plugin-contributed step handler. */
  public registerStepHandler(handler: WorkflowStepHandler): void {
    this.steps.register(handler);
  }

  /** Starts a workflow directly. */
  public start(
    workflowId: string,
    variables: Readonly<Record<string, WorkflowValue>> = {},
    context: Readonly<Record<string, WorkflowValue>> = {},
    dryRun = false,
  ): Promise<WorkflowExecution> {
    const workflow = this.registry.require(workflowId);
    return this.scheduler.schedule({
      context,
      dryRun,
      trigger: {
        name: 'manual',
        payload: null,
        type: 'manual',
      },
      variables,
      workflow,
    });
  }

  /** Resolves a trigger event and starts matching workflows. */
  public async trigger(
    event: WorkflowTriggerEvent,
    variables: Readonly<Record<string, WorkflowValue>> = {},
    context: Readonly<Record<string, WorkflowValue>> = {},
    dryRun = false,
  ): Promise<readonly WorkflowExecution[]> {
    const workflows = this.triggers.resolve(this.registry.list(), event);
    const executions: WorkflowExecution[] = [];

    for (const workflow of workflows) {
      executions.push(
        await this.scheduler.schedule({
          context,
          dryRun,
          trigger: event,
          variables,
          workflow,
        }),
      );
    }

    return executions;
  }

  /** Approves, rejects, or modifies a pending human approval and resumes execution. */
  public async approve(decision: WorkflowApprovalDecision): Promise<WorkflowExecution> {
    const execution = await this.findExecutionByApproval(decision.approvalId);
    const workflow = this.registry.require(execution.workflowId);
    return this.executor.approve(workflow, execution, decision);
  }

  /** Pauses a pending or running execution. */
  public async pause(executionId: string): Promise<WorkflowExecution> {
    const execution = await this.requireExecution(executionId);
    return this.state.setStatus(execution, 'paused');
  }

  /** Cancels an execution and emits a cancellation event. */
  public async cancel(executionId: string): Promise<WorkflowExecution> {
    const execution = await this.requireExecution(executionId);
    const cancelled = await this.state.setStatus(execution, 'cancelled');
    await this.events.emit('workflow.cancelled', { executionId });
    return cancelled;
  }

  /** Retries a failed or paused execution from its latest recoverable step. */
  public async retryExecution(executionId: string): Promise<WorkflowExecution> {
    const execution = await this.requireExecution(executionId);
    const workflow = this.registry.require(execution.workflowId);
    const running = await this.state.setStatus(execution, 'running');
    return this.executor.resume(workflow, running);
  }

  /** Recovers persisted pending/running executions after restart. */
  public recover(): Promise<readonly WorkflowExecution[]> {
    return this.recovery.recover();
  }

  /** Lists known executions. */
  public executions(): Promise<readonly WorkflowExecution[]> {
    return this.state.list();
  }

  /** Returns the planner-generated workflow for a goal. */
  public async plan(goal: string, context: WorkflowValue): Promise<WorkflowDefinition> {
    if (this.planner === undefined) {
      throw new WorkflowRuntimeError('WORKFLOW_NOT_FOUND', 'Workflow planner is not configured.');
    }

    return this.planner.plan(goal, context);
  }

  private async findExecutionByApproval(approvalId: string): Promise<WorkflowExecution> {
    const executions = await this.state.list();
    const execution = executions.find((item) => item.waitingApprovalId === approvalId);

    if (execution === undefined) {
      throw new WorkflowRuntimeError(
        'WORKFLOW_WAITING_APPROVAL',
        `Approval not found: ${approvalId}`,
      );
    }

    return execution;
  }

  private async requireExecution(executionId: string): Promise<WorkflowExecution> {
    const execution = await this.state.get(executionId);

    if (execution === undefined) {
      throw new WorkflowRuntimeError('WORKFLOW_NOT_FOUND', `Execution not found: ${executionId}`);
    }

    return execution;
  }
}
