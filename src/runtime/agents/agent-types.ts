import type { RuntimeResult } from '@/runtime/utils';

/** Stable Browser Agent Runtime version. */
export const AGENT_RUNTIME_VERSION = '1.0.0';

/** JSON-like value allowed in persisted agent state. */
export type AgentValue =
  boolean | null | number | string | { readonly [key: string]: AgentValue } | readonly AgentValue[];

/** Agent session state. */
export type AgentSessionStatus =
  'cancelled' | 'completed' | 'failed' | 'paused' | 'planning' | 'running' | 'waiting-approval';

/** Agent memory scope. */
export type AgentMemoryScope =
  'knowledge' | 'long-term' | 'preference' | 'session' | 'short-term' | 'task-history';

/** Agent permission. */
export type AgentPermission =
  | 'ai.request'
  | 'api.request'
  | 'browser.control'
  | 'command.execute'
  | 'knowledge.read'
  | 'memory.read'
  | 'memory.write'
  | 'plugin.execute'
  | 'workflow.start';

/** Agent tool risk. */
export type AgentToolRisk = 'high' | 'low' | 'medium';

/** Agent tool availability. */
export type AgentToolAvailability = 'available' | 'degraded' | 'offline' | 'unavailable';

/** Agent identity. */
export interface AgentIdentity {
  /** Stable identity id. */
  readonly id: string;
  /** Identity type. */
  readonly type: 'plugin' | 'system' | 'user';
  /** Display label. */
  readonly label: string;
}

/** User goal after understanding. */
export interface AgentGoal {
  /** Stable goal id. */
  readonly id: string;
  /** Natural language or structured objective. */
  readonly objective: string;
  /** Goal constraints. */
  readonly constraints: readonly string[];
  /** Success criteria. */
  readonly successCriteria: readonly string[];
  /** User preferences. */
  readonly preferences: Readonly<Record<string, AgentValue>>;
  /** Optional deadline timestamp. */
  readonly deadlineAt?: number;
  /** Permissions available to this goal. */
  readonly permissions: readonly AgentPermission[];
  /** Expected output description. */
  readonly expectedOutput: string;
}

/** Raw user goal input. */
export type AgentGoalInput =
  | string
  | {
      /** Objective. */
      readonly objective: string;
      /** Constraints. */
      readonly constraints?: readonly string[];
      /** Success criteria. */
      readonly successCriteria?: readonly string[];
      /** User preferences. */
      readonly preferences?: Readonly<Record<string, AgentValue>>;
      /** Optional deadline timestamp. */
      readonly deadlineAt?: number;
      /** Permissions. */
      readonly permissions?: readonly AgentPermission[];
      /** Expected output. */
      readonly expectedOutput?: string;
    };

/** Planned agent step. */
export interface AgentStep {
  /** Step id. */
  readonly id: string;
  /** Step objective. */
  readonly objective: string;
  /** Candidate tool names. */
  readonly toolNames: readonly string[];
  /** Step input. */
  readonly input: AgentValue;
  /** Dependencies. */
  readonly dependsOn: readonly string[];
  /** Success check. */
  readonly successCriteria: readonly string[];
  /** Whether this step can run in parallel with siblings. */
  readonly parallelizable: boolean;
}

/** Agent plan. */
export interface AgentPlan {
  /** Plan id. */
  readonly id: string;
  /** Goal id. */
  readonly goalId: string;
  /** Plan version. */
  readonly version: number;
  /** Steps. */
  readonly steps: readonly AgentStep[];
  /** Strategy summary. */
  readonly strategy: string;
  /** Fallback strategy summary. */
  readonly fallbackStrategy: string;
}

/** Agent observation. */
export interface AgentObservation {
  /** Observation id. */
  readonly id: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Source tool or browser adapter. */
  readonly source: string;
  /** Summary of what changed. */
  readonly summary: string;
  /** Observed data. */
  readonly data: AgentValue;
  /** Whether the action appears successful. */
  readonly success: boolean;
}

/** Agent decision log. */
export interface AgentDecision {
  /** Decision id. */
  readonly id: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Step id. */
  readonly stepId: string;
  /** Selected tool. */
  readonly toolName: string;
  /** Reason. */
  readonly reason: string;
  /** Expected outcome. */
  readonly expectedOutcome: string;
}

/** Agent tool input schema. */
export interface AgentToolSchema {
  /** Schema version. */
  readonly version: number;
  /** Required input fields. */
  readonly required: readonly string[];
}

/** Agent tool metadata. */
export interface AgentToolMetadata {
  /** Tool name. */
  readonly name: string;
  /** Human-readable description. */
  readonly description: string;
  /** Input schema. */
  readonly schema: AgentToolSchema;
  /** Required permissions. */
  readonly permissions: readonly AgentPermission[];
  /** Tool cost score. */
  readonly cost: number;
  /** Tool risk. */
  readonly risk: AgentToolRisk;
  /** Expected latency. */
  readonly latencyMs: number;
  /** Tool availability. */
  readonly availability: AgentToolAvailability;
}

/** Tool execution request. */
export interface AgentToolRequest {
  /** Session id. */
  readonly sessionId: string;
  /** Step id. */
  readonly stepId: string;
  /** Tool input. */
  readonly input: AgentValue;
  /** Dry-run flag. */
  readonly dryRun: boolean;
}

/** Tool execution response. */
export interface AgentToolResponse {
  /** Tool output. */
  readonly output: AgentValue;
  /** Observation produced by the tool. */
  readonly observation: AgentObservation;
}

/** Agent tool contract. */
export interface AgentTool {
  /** Tool metadata. */
  readonly metadata: AgentToolMetadata;
  /** Executes the tool. */
  execute(request: AgentToolRequest): Promise<AgentToolResponse>;
}

/** Agent memory entry. */
export interface AgentMemoryEntry {
  /** Memory id. */
  readonly id: string;
  /** Scope. */
  readonly scope: AgentMemoryScope;
  /** Session id. */
  readonly sessionId?: string;
  /** Content summary. */
  readonly summary: string;
  /** Stored value. */
  readonly value: AgentValue;
  /** Sensitivity label. */
  readonly sensitivity: 'confidential' | 'personal' | 'public' | 'restricted';
  /** Created timestamp. */
  readonly createdAt: number;
}

/** Agent timeline event. */
export interface AgentTimelineEvent {
  /** Event id. */
  readonly id: string;
  /** Event type. */
  readonly type: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Message. */
  readonly message: string;
  /** Safe details. */
  readonly details?: Readonly<Record<string, AgentValue>>;
}

/** Human approval request. */
export interface AgentApprovalRequest {
  /** Approval id. */
  readonly id: string;
  /** Session id. */
  readonly sessionId: string;
  /** Step id. */
  readonly stepId: string;
  /** Tool name. */
  readonly toolName: string;
  /** Reason. */
  readonly reason: string;
  /** Risk. */
  readonly risk: AgentToolRisk;
  /** Tool input. */
  readonly input: AgentValue;
}

/** Human approval decision. */
export interface AgentApprovalDecision {
  /** Approval id. */
  readonly approvalId: string;
  /** Decision. */
  readonly decision: 'approved' | 'modified' | 'rejected';
  /** Optional modified input. */
  readonly modifiedInput?: AgentValue;
  /** Optional comment. */
  readonly comment?: string;
}

/** Agent session. */
export interface AgentSession {
  /** Session id. */
  readonly id: string;
  /** Identity. */
  readonly identity: AgentIdentity;
  /** Goal. */
  readonly goal: AgentGoal;
  /** Plan. */
  readonly plan: AgentPlan;
  /** Status. */
  readonly status: AgentSessionStatus;
  /** Current step id. */
  readonly currentStepId?: string;
  /** Waiting approval id. */
  readonly waitingApprovalId?: string;
  /** Step outputs. */
  readonly outputs: Readonly<Record<string, AgentValue>>;
  /** Observations. */
  readonly observations: readonly AgentObservation[];
  /** Decisions. */
  readonly decisions: readonly AgentDecision[];
  /** Timeline. */
  readonly timeline: readonly AgentTimelineEvent[];
  /** Failure count. */
  readonly failureCount: number;
  /** Maximum step count. */
  readonly maxSteps: number;
  /** Dry-run flag. */
  readonly dryRun: boolean;
  /** Created timestamp. */
  readonly createdAt: number;
  /** Updated timestamp. */
  readonly updatedAt: number;
}

/** Agent final result. */
export interface AgentResult {
  /** Session id. */
  readonly sessionId: string;
  /** Status. */
  readonly status: AgentSessionStatus;
  /** Final output. */
  readonly output: AgentValue;
  /** Summary. */
  readonly summary: string;
}

/** Agent runtime event map. */
export interface AgentRuntimeEvents {
  readonly 'agent.approvalRequested': AgentApprovalRequest;
  readonly 'agent.completed': AgentResult;
  readonly 'agent.decision': AgentDecision;
  readonly 'agent.failed': { readonly sessionId: string; readonly message: string };
  readonly 'agent.observed': AgentObservation & { readonly sessionId: string };
  readonly 'agent.paused': { readonly sessionId: string };
  readonly 'agent.started': { readonly sessionId: string; readonly goalId: string };
  readonly 'agent.stepStarted': { readonly sessionId: string; readonly stepId: string };
  readonly 'agent.timeline': AgentTimelineEvent & { readonly sessionId: string };
}

/** Agent operation result. */
export type AgentOperationResult<Value = void> = RuntimeResult<Value, AgentRuntimeError>;

/** Agent runtime error code. */
export type AgentRuntimeErrorCode =
  | 'AGENT_APPROVAL_REQUIRED'
  | 'AGENT_CANCELLED'
  | 'AGENT_GOAL_INVALID'
  | 'AGENT_LIMIT_EXCEEDED'
  | 'AGENT_PERMISSION_DENIED'
  | 'AGENT_SESSION_NOT_FOUND'
  | 'AGENT_TOOL_FAILED'
  | 'AGENT_TOOL_NOT_FOUND';

/** Structured agent error. */
export class AgentRuntimeError extends Error {
  /** Stable error code. */
  public readonly code: AgentRuntimeErrorCode;

  /** Safe details. */
  public readonly details: Readonly<Record<string, AgentValue>> | undefined;

  public constructor(
    code: AgentRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, AgentValue>>,
  ) {
    super(message);
    this.name = 'AgentRuntimeError';
    this.code = code;
    this.details = details;
  }
}

/** Planner contract. */
export interface AgentPlanner {
  /** Creates a plan for a goal. */
  plan(
    goal: AgentGoal,
    memory: readonly AgentMemoryEntry[],
    tools: readonly AgentToolMetadata[],
  ): Promise<AgentPlan>;
  /** Revises a plan after a failed step or new observation. */
  replan(
    session: AgentSession,
    reason: string,
    tools: readonly AgentToolMetadata[],
  ): Promise<AgentPlan>;
}

/** Browser control adapter boundary. */
export interface AgentBrowserControlAdapter {
  /** Executes semantic browser control. */
  execute(action: string, input: AgentValue): Promise<AgentToolResponse>;
}
