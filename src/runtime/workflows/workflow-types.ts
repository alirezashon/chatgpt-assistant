import type { RuntimeResult } from '@/runtime/utils';

/** Stable workflow runtime version. */
export const WORKFLOW_RUNTIME_VERSION = '1.0.0';

/** JSON-like value allowed in persisted workflow state. */
export type WorkflowValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: WorkflowValue }
  | readonly WorkflowValue[];

/** Runtime workflow permission. */
export type WorkflowPermission =
  | 'ai.request'
  | 'api.request'
  | 'browser.action'
  | 'command.execute'
  | 'human.approval'
  | 'plugin.execute'
  | 'storage.write'
  | 'workflow.start';

/** Workflow visibility scope. */
export type WorkflowVisibility = 'enterprise' | 'private' | 'public' | 'team';

/** Workflow execution status. */
export type WorkflowExecutionStatus =
  'cancelled' | 'failed' | 'paused' | 'pending' | 'running' | 'succeeded' | 'waiting-approval';

/** Workflow step status. */
export type WorkflowStepStatus = 'failed' | 'running' | 'skipped' | 'succeeded' | 'waiting';

/** Workflow trigger type. */
export type WorkflowTriggerType =
  | 'api-event'
  | 'browser-event'
  | 'command-executed'
  | 'keyboard-shortcut'
  | 'manual'
  | 'plugin-event'
  | 'schedule'
  | 'webhook';

/** Workflow step type. */
export type WorkflowStepType =
  | 'ai'
  | 'api'
  | 'browser-action'
  | 'command'
  | 'condition'
  | 'delay'
  | 'human-approval'
  | 'loop'
  | 'parallel'
  | 'plugin'
  | 'sub-workflow'
  | 'transform';

/** Workflow owner metadata. */
export interface WorkflowOwner {
  /** Owner id. */
  readonly id: string;
  /** Owner kind. */
  readonly type: 'plugin' | 'team' | 'user';
}

/** Retry policy. */
export interface WorkflowRetryPolicy {
  /** Attempts including the first try. */
  readonly maxAttempts: number;
  /** Initial delay in milliseconds. */
  readonly initialDelayMs: number;
  /** Delay multiplier. */
  readonly multiplier: number;
}

/** Error strategy for workflow or step failure. */
export type WorkflowErrorStrategy = 'compensate' | 'fail' | 'human-intervention' | 'retry' | 'skip';

/** Typed variable schema. */
export interface WorkflowVariableSchema {
  /** Variable type. */
  readonly type: 'boolean' | 'number' | 'object' | 'string';
  /** Whether the variable is required. */
  readonly required: boolean;
  /** Optional default value. */
  readonly defaultValue?: WorkflowValue;
}

/** Condition operator. */
export type WorkflowConditionOperator =
  'contains' | 'eq' | 'exists' | 'gt' | 'gte' | 'lt' | 'lte' | 'neq';

/** Condition expression. */
export interface WorkflowCondition {
  /** Left operand path or literal. */
  readonly left: string;
  /** Operator. */
  readonly operator: WorkflowConditionOperator;
  /** Right operand path or literal. */
  readonly right?: WorkflowValue | string;
}

/** Trigger definition. */
export interface WorkflowTrigger {
  /** Trigger type. */
  readonly type: WorkflowTriggerType;
  /** Trigger name or event id. */
  readonly name: string;
  /** Optional match metadata. */
  readonly metadata?: Readonly<Record<string, WorkflowValue>>;
}

/** Base workflow step. */
export interface WorkflowBaseStep {
  /** Step id. */
  readonly id: string;
  /** Step type. */
  readonly type: WorkflowStepType;
  /** Optional display name. */
  readonly name?: string;
  /** Optional precondition. */
  readonly condition?: WorkflowCondition;
  /** Step permissions. */
  readonly permissions?: readonly WorkflowPermission[];
  /** Step timeout. */
  readonly timeoutMs?: number;
  /** Step retry policy. */
  readonly retryPolicy?: WorkflowRetryPolicy;
  /** Step-level error strategy. */
  readonly errorStrategy?: WorkflowErrorStrategy;
}

/** Command step. */
export interface WorkflowCommandStep extends WorkflowBaseStep {
  readonly type: 'command';
  /** Command id. */
  readonly commandId: string;
  /** Command input. */
  readonly input?: WorkflowValue;
}

/** AI step. */
export interface WorkflowAIStep extends WorkflowBaseStep {
  readonly type: 'ai';
  /** AI task type. */
  readonly taskType: string;
  /** User intent. */
  readonly intent: string;
  /** Prompt template id. */
  readonly promptTemplateId: string;
  /** Prompt variables. */
  readonly variables: Readonly<Record<string, string>>;
}

/** Condition step. */
export interface WorkflowConditionStep extends WorkflowBaseStep {
  readonly type: 'condition';
  /** Condition to evaluate. */
  readonly expression: WorkflowCondition;
}

/** Transform step. */
export interface WorkflowTransformStep extends WorkflowBaseStep {
  readonly type: 'transform';
  /** Values to assign to step output. */
  readonly assign: Readonly<Record<string, string | WorkflowValue>>;
}

/** API step. */
export interface WorkflowApiStep extends WorkflowBaseStep {
  readonly type: 'api';
  /** API operation id. */
  readonly operation: string;
  /** API input. */
  readonly input?: WorkflowValue;
}

/** Browser action step. */
export interface WorkflowBrowserActionStep extends WorkflowBaseStep {
  readonly type: 'browser-action';
  /** Browser action id. */
  readonly action: string;
  /** Browser action input. */
  readonly input?: WorkflowValue;
}

/** Plugin step. */
export interface WorkflowPluginStep extends WorkflowBaseStep {
  readonly type: 'plugin';
  /** Plugin id. */
  readonly pluginId: string;
  /** Plugin action. */
  readonly action: string;
  /** Plugin action input. */
  readonly input?: WorkflowValue;
}

/** Human approval step. */
export interface WorkflowHumanApprovalStep extends WorkflowBaseStep {
  readonly type: 'human-approval';
  /** Approval prompt. */
  readonly prompt: string;
  /** Approval risk level. */
  readonly risk: 'high' | 'low' | 'medium';
}

/** Delay step. */
export interface WorkflowDelayStep extends WorkflowBaseStep {
  readonly type: 'delay';
  /** Delay duration. */
  readonly delayMs: number;
}

/** Parallel step. */
export interface WorkflowParallelStep extends WorkflowBaseStep {
  readonly type: 'parallel';
  /** Parallel branches. */
  readonly branches: readonly (readonly WorkflowStep[])[];
}

/** Loop step. */
export interface WorkflowLoopStep extends WorkflowBaseStep {
  readonly type: 'loop';
  /** Path to iterable value. */
  readonly itemsPath: string;
  /** Maximum iterations. */
  readonly maxIterations: number;
  /** Steps per item. */
  readonly steps: readonly WorkflowStep[];
}

/** Sub-workflow step. */
export interface WorkflowSubWorkflowStep extends WorkflowBaseStep {
  readonly type: 'sub-workflow';
  /** Child workflow id. */
  readonly workflowId: string;
  /** Child workflow input. */
  readonly input?: WorkflowValue;
}

/** Any workflow step. */
export type WorkflowStep =
  | WorkflowAIStep
  | WorkflowApiStep
  | WorkflowBrowserActionStep
  | WorkflowCommandStep
  | WorkflowConditionStep
  | WorkflowDelayStep
  | WorkflowHumanApprovalStep
  | WorkflowLoopStep
  | WorkflowParallelStep
  | WorkflowPluginStep
  | WorkflowSubWorkflowStep
  | WorkflowTransformStep;

/** Complete workflow definition. */
export interface WorkflowDefinition {
  /** Workflow id. */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** Semantic version. */
  readonly version: string;
  /** Trigger. */
  readonly trigger: WorkflowTrigger;
  /** Steps. */
  readonly steps: readonly WorkflowStep[];
  /** Reusable conditions. */
  readonly conditions?: Readonly<Record<string, WorkflowCondition>>;
  /** Variable schemas. */
  readonly variables: Readonly<Record<string, WorkflowVariableSchema>>;
  /** Required workflow permissions. */
  readonly permissions: readonly WorkflowPermission[];
  /** Workflow timeout. */
  readonly timeoutMs: number;
  /** Default retry policy. */
  readonly retryPolicy: WorkflowRetryPolicy;
  /** Default error strategy. */
  readonly errorStrategy: WorkflowErrorStrategy;
  /** Retain detailed history. */
  readonly history: boolean;
  /** Owner. */
  readonly owner: WorkflowOwner;
  /** Visibility. */
  readonly visibility: WorkflowVisibility;
  /** Metadata. */
  readonly metadata: Readonly<Record<string, WorkflowValue>>;
}

/** Triggered workflow input. */
export interface WorkflowTriggerEvent {
  /** Trigger type. */
  readonly type: WorkflowTriggerType;
  /** Trigger name. */
  readonly name: string;
  /** Trigger payload. */
  readonly payload: WorkflowValue;
}

/** Workflow execution context. */
export interface WorkflowExecutionContext {
  /** Execution id. */
  readonly executionId: string;
  /** Workflow definition. */
  readonly workflow: WorkflowDefinition;
  /** Trigger event. */
  readonly trigger: WorkflowTriggerEvent;
  /** Variables. */
  readonly variables: Readonly<Record<string, WorkflowValue>>;
  /** Context values. */
  readonly context: Readonly<Record<string, WorkflowValue>>;
  /** Step outputs. */
  readonly outputs: Readonly<Record<string, WorkflowValue>>;
  /** Current loop item. */
  readonly item?: WorkflowValue;
  /** Dry run mode. */
  readonly dryRun: boolean;
}

/** Step execution result. */
export interface WorkflowStepResult {
  /** Step status. */
  readonly status: WorkflowStepStatus;
  /** Step output. */
  readonly output?: WorkflowValue;
  /** Waiting approval id. */
  readonly approvalId?: string;
  /** Error message. */
  readonly error?: string;
}

/** Step handler contract. */
export interface WorkflowStepHandler<Step extends WorkflowStep = WorkflowStep> {
  /** Step type handled by this handler. */
  readonly type: Step['type'];
  /** Executes a step. */
  execute(step: Step, context: WorkflowExecutionContext): Promise<WorkflowStepResult>;
}

/** Timeline event. */
export interface WorkflowTimelineEvent {
  /** Event id. */
  readonly id: string;
  /** Event type. */
  readonly type: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Optional step id. */
  readonly stepId?: string;
  /** Message. */
  readonly message: string;
  /** Safe details. */
  readonly details?: Readonly<Record<string, WorkflowValue>>;
}

/** Step execution state. */
export interface WorkflowStepExecutionState {
  /** Step id. */
  readonly stepId: string;
  /** Status. */
  readonly status: WorkflowStepStatus;
  /** Attempts. */
  readonly attempts: number;
  /** Output. */
  readonly output?: WorkflowValue;
  /** Error. */
  readonly error?: string;
}

/** Persisted workflow execution. */
export interface WorkflowExecution {
  /** Execution id. */
  readonly id: string;
  /** Workflow id. */
  readonly workflowId: string;
  /** Workflow version. */
  readonly workflowVersion: string;
  /** Status. */
  readonly status: WorkflowExecutionStatus;
  /** Trigger event. */
  readonly trigger: WorkflowTriggerEvent;
  /** Variables. */
  readonly variables: Readonly<Record<string, WorkflowValue>>;
  /** Context values. */
  readonly context: Readonly<Record<string, WorkflowValue>>;
  /** Step outputs. */
  readonly outputs: Readonly<Record<string, WorkflowValue>>;
  /** Step states. */
  readonly steps: Readonly<Record<string, WorkflowStepExecutionState>>;
  /** Current step id. */
  readonly currentStepId?: string;
  /** Approval id when waiting. */
  readonly waitingApprovalId?: string;
  /** Created timestamp. */
  readonly createdAt: number;
  /** Updated timestamp. */
  readonly updatedAt: number;
  /** Timeline. */
  readonly timeline: readonly WorkflowTimelineEvent[];
  /** Dry run mode. */
  readonly dryRun: boolean;
}

/** Execution checkpoint. */
export interface WorkflowCheckpoint {
  /** Checkpoint id. */
  readonly id: string;
  /** Execution id. */
  readonly executionId: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Persisted execution snapshot. */
  readonly execution: WorkflowExecution;
}

/** Human approval request. */
export interface WorkflowApprovalRequest {
  /** Approval id. */
  readonly id: string;
  /** Execution id. */
  readonly executionId: string;
  /** Step id. */
  readonly stepId: string;
  /** Prompt. */
  readonly prompt: string;
  /** Risk level. */
  readonly risk: 'high' | 'low' | 'medium';
  /** Created timestamp. */
  readonly createdAt: number;
}

/** Human approval decision. */
export interface WorkflowApprovalDecision {
  /** Approval id. */
  readonly approvalId: string;
  /** Decision. */
  readonly decision: 'approved' | 'modified' | 'rejected';
  /** Optional comment. */
  readonly comment?: string;
  /** Optional modified input. */
  readonly modifiedInput?: WorkflowValue;
}

/** Workflow runtime event map. */
export interface WorkflowRuntimeEvents {
  readonly 'workflow.approvalRequested': WorkflowApprovalRequest;
  readonly 'workflow.cancelled': { readonly executionId: string };
  readonly 'workflow.checkpointed': WorkflowCheckpoint;
  readonly 'workflow.completed': {
    readonly executionId: string;
    readonly status: WorkflowExecutionStatus;
  };
  readonly 'workflow.failed': { readonly executionId: string; readonly message: string };
  readonly 'workflow.started': { readonly executionId: string; readonly workflowId: string };
  readonly 'workflow.stepCompleted': {
    readonly executionId: string;
    readonly stepId: string;
    readonly status: WorkflowStepStatus;
  };
  readonly 'workflow.stepStarted': { readonly executionId: string; readonly stepId: string };
}

/** Workflow operation result. */
export type WorkflowOperationResult<Value = void> = RuntimeResult<Value, WorkflowRuntimeError>;

/** Workflow runtime error code. */
export type WorkflowRuntimeErrorCode =
  | 'WORKFLOW_CANCELLED'
  | 'WORKFLOW_CONDITION_FAILED'
  | 'WORKFLOW_INVALID_SCHEMA'
  | 'WORKFLOW_NOT_FOUND'
  | 'WORKFLOW_PERMISSION_DENIED'
  | 'WORKFLOW_STEP_FAILED'
  | 'WORKFLOW_TIMEOUT'
  | 'WORKFLOW_WAITING_APPROVAL';

/** Structured workflow error. */
export class WorkflowRuntimeError extends Error {
  /** Stable error code. */
  public readonly code: WorkflowRuntimeErrorCode;

  /** Safe diagnostic details. */
  public readonly details: Readonly<Record<string, WorkflowValue>> | undefined;

  public constructor(
    code: WorkflowRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, WorkflowValue>>,
  ) {
    super(message);
    this.name = 'WorkflowRuntimeError';
    this.code = code;
    this.details = details;
  }
}

/** Command gateway. */
export interface WorkflowCommandGateway {
  /** Executes a command. */
  execute(
    commandId: string,
    input: WorkflowValue,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowValue>;
}

/** AI gateway. */
export interface WorkflowAIGateway {
  /** Executes an AI request. */
  complete(step: WorkflowAIStep, context: WorkflowExecutionContext): Promise<WorkflowValue>;
}

/** API gateway. */
export interface WorkflowApiGateway {
  /** Executes an API operation. */
  execute(
    operation: string,
    input: WorkflowValue,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowValue>;
}

/** Browser action gateway. */
export interface WorkflowBrowserGateway {
  /** Executes a browser action. */
  execute(
    action: string,
    input: WorkflowValue,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowValue>;
}

/** Plugin action gateway. */
export interface WorkflowPluginGateway {
  /** Executes a plugin action. */
  execute(
    pluginId: string,
    action: string,
    input: WorkflowValue,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowValue>;
}

/** Sub-workflow gateway. */
export interface WorkflowSubWorkflowGateway {
  /** Starts a child workflow and returns its output. */
  execute(
    workflowId: string,
    input: WorkflowValue,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowValue>;
}

/** Planner gateway for future AI agent planning. */
export interface WorkflowPlanner {
  /** Creates a workflow definition from a goal and context. */
  plan(goal: string, context: WorkflowValue): Promise<WorkflowDefinition>;
}
