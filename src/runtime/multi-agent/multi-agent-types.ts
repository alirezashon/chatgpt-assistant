import type { AgentValue } from '@/runtime/agents';

/** Stable multi-agent runtime version. */
export const MULTI_AGENT_RUNTIME_VERSION = '1.0.0';

/** JSON-like value for collaboration state. */
export type MultiAgentValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: MultiAgentValue }
  | readonly MultiAgentValue[];

/** Specialized agent category. */
export type MultiAgentKind =
  | 'automation'
  | 'browser'
  | 'coding'
  | 'data'
  | 'planning'
  | 'research'
  | 'review'
  | 'security'
  | 'testing'
  | 'writing';

/** Agent permission scoped to organization runtime actions. */
export type MultiAgentPermission =
  | 'agent.delegate'
  | 'agent.message'
  | 'ai.request'
  | 'blackboard.read'
  | 'blackboard.write'
  | 'browser.read'
  | 'browser.write'
  | 'command.execute'
  | 'filesystem.read'
  | 'filesystem.write'
  | 'human.approval'
  | 'knowledge.read'
  | 'memory.read.private'
  | 'memory.read.shared'
  | 'memory.write.private'
  | 'memory.write.shared'
  | 'network.request'
  | 'plugin.execute'
  | 'security.review'
  | 'tool.deploy'
  | 'workflow.start';

/** Agent health status. */
export type MultiAgentHealthStatus = 'degraded' | 'healthy' | 'offline' | 'unavailable';

/** Task execution strategy. */
export type MultiAgentExecutionStrategy =
  | 'competitive'
  | 'consensus'
  | 'debate'
  | 'iterative'
  | 'parallel'
  | 'reflection-loop'
  | 'self-review'
  | 'sequential';

/** Session status. */
export type MultiAgentSessionStatus =
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'planning'
  | 'running'
  | 'waiting-approval';

/** Task status. */
export type MultiAgentTaskStatus =
  | 'blocked'
  | 'cancelled'
  | 'failed'
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'waiting-approval';

/** Message type. */
export type MultiAgentMessageType =
  | 'event'
  | 'request'
  | 'response'
  | 'status'
  | 'supervisor-decision';

/** Blackboard artifact kind. */
export type BlackboardArtifactKind =
  | 'artifact'
  | 'decision'
  | 'document'
  | 'observation'
  | 'task-output';

/** Agent capability declaration. */
export interface AgentCapability {
  /** Stable capability id. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** Capability description. */
  readonly description: string;
  /** Routing keywords. */
  readonly keywords: readonly string[];
  /** Tool names the capability may use. */
  readonly toolNames: readonly string[];
  /** Required permissions. */
  readonly permissions: readonly MultiAgentPermission[];
  /** Confidence in the capability, 0-1. */
  readonly confidence: number;
}

/** Agent version. */
export interface AgentVersion {
  /** Semantic version. */
  readonly version: string;
  /** Release channel. */
  readonly channel: 'canary' | 'stable';
}

/** Agent health. */
export interface AgentHealth {
  /** Status. */
  readonly status: MultiAgentHealthStatus;
  /** Last heartbeat timestamp. */
  readonly lastHeartbeatAt: number;
  /** Success rate, 0-1. */
  readonly successRate: number;
  /** Average latency in milliseconds. */
  readonly latencyMs: number;
}

/** Agent cost model. */
export interface AgentCostModel {
  /** Cost per task. */
  readonly baseCost: number;
  /** Cost per estimated 1k tokens. */
  readonly tokenCostPer1k: number;
  /** Tool cost multiplier. */
  readonly toolCostMultiplier: number;
}

/** Agent profile. */
export interface AgentProfile {
  /** Profile id. */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** Purpose. */
  readonly purpose: string;
  /** Capabilities. */
  readonly capabilities: readonly AgentCapability[];
  /** Tool allow-list. */
  readonly tools: readonly string[];
  /** Memory access rules. */
  readonly memoryAccess: readonly MultiAgentPermission[];
  /** Knowledge access rules. */
  readonly knowledgeAccess: readonly MultiAgentPermission[];
  /** Allowed actions. */
  readonly allowedActions: readonly MultiAgentPermission[];
  /** Explicit limitations. */
  readonly limitations: readonly string[];
  /** Version. */
  readonly version: AgentVersion;
  /** Health. */
  readonly health: AgentHealth;
  /** Cost model. */
  readonly costModel: AgentCostModel;
  /** Maximum concurrent task count. */
  readonly maxConcurrentTasks: number;
}

/** Agent definition registered with the organization runtime. */
export interface AgentDefinition {
  /** Agent id. */
  readonly id: string;
  /** Agent kind. */
  readonly kind: MultiAgentKind;
  /** Agent profile. */
  readonly profile: AgentProfile;
}

/** Goal input. */
export interface MultiAgentGoalInput {
  /** Objective. */
  readonly objective: string;
  /** Constraints. */
  readonly constraints?: readonly string[];
  /** Success criteria. */
  readonly successCriteria?: readonly string[];
  /** Deadline timestamp. */
  readonly deadlineAt?: number;
  /** Budget. */
  readonly budget?: MultiAgentBudget;
  /** Preferred strategy. */
  readonly strategy?: MultiAgentExecutionStrategy;
}

/** Execution budget. */
export interface MultiAgentBudget {
  /** Maximum estimated tokens. */
  readonly maxTokens: number;
  /** Maximum cost units. */
  readonly maxCost: number;
  /** Maximum execution time. */
  readonly maxRuntimeMs: number;
}

/** Task graph task. */
export interface MultiAgentTask {
  /** Task id. */
  readonly id: string;
  /** Title. */
  readonly title: string;
  /** Description. */
  readonly description: string;
  /** Required capability ids. */
  readonly requiredCapabilities: readonly string[];
  /** Dependencies. */
  readonly dependencies: readonly string[];
  /** Priority, higher runs first. */
  readonly priority: number;
  /** Strategy. */
  readonly strategy: MultiAgentExecutionStrategy;
  /** Required permissions. */
  readonly permissions: readonly MultiAgentPermission[];
  /** Constraints. */
  readonly constraints: readonly string[];
  /** Success criteria. */
  readonly successCriteria: readonly string[];
  /** Deadline timestamp. */
  readonly deadlineAt?: number;
  /** Assigned agent. */
  readonly assignedAgentId?: string;
  /** Status. */
  readonly status: MultiAgentTaskStatus;
  /** Attempts. */
  readonly attempts: number;
  /** Maximum attempts. */
  readonly maxAttempts: number;
  /** Timeout. */
  readonly timeoutMs: number;
  /** Latest error. */
  readonly error?: string;
}

/** Task graph. */
export interface MultiAgentTaskGraph {
  /** Graph id. */
  readonly id: string;
  /** Tasks. */
  readonly tasks: readonly MultiAgentTask[];
  /** Strategy. */
  readonly strategy: MultiAgentExecutionStrategy;
}

/** Agent execution context. */
export interface AgentExecutionContext {
  /** Session id. */
  readonly sessionId: string;
  /** Agent definition. */
  readonly agent: AgentDefinition;
  /** Goal. */
  readonly goal: MultiAgentGoalInput;
  /** Current task. */
  readonly task: MultiAgentTask;
  /** Blackboard snapshot. */
  readonly blackboard: BlackboardSnapshot;
  /** Messages visible to agent. */
  readonly messages: readonly AgentMessage[];
  /** Dry-run flag. */
  readonly dryRun: boolean;
}

/** Agent execution output. */
export interface AgentTaskResult {
  /** Whether the task succeeded. */
  readonly success: boolean;
  /** Output value. */
  readonly output: MultiAgentValue;
  /** Summary. */
  readonly summary: string;
  /** Confidence, 0-1. */
  readonly confidence: number;
  /** Quality score, 0-1. */
  readonly quality: number;
  /** Estimated tokens used. */
  readonly tokenUsage: number;
  /** Estimated cost units. */
  readonly cost: number;
  /** Issues found by agent. */
  readonly issues: readonly string[];
  /** Requested follow-up actions. */
  readonly followUps: readonly string[];
}

/** Agent executor contract. */
export interface AgentExecutor {
  /** Executes a task. */
  execute(context: AgentExecutionContext): Promise<AgentTaskResult>;
}

/** Versioned blackboard artifact. */
export interface BlackboardArtifact {
  /** Artifact id. */
  readonly id: string;
  /** Kind. */
  readonly kind: BlackboardArtifactKind;
  /** Owner agent id. */
  readonly ownerAgentId: string;
  /** Task id. */
  readonly taskId: string;
  /** Version. */
  readonly version: number;
  /** Content. */
  readonly content: MultiAgentValue;
  /** Summary. */
  readonly summary: string;
  /** Permissions required to read/write. */
  readonly permissions: readonly MultiAgentPermission[];
  /** Created timestamp. */
  readonly createdAt: number;
  /** Updated timestamp. */
  readonly updatedAt: number;
  /** History. */
  readonly history: readonly BlackboardArtifactVersion[];
}

/** Blackboard artifact version. */
export interface BlackboardArtifactVersion {
  /** Version. */
  readonly version: number;
  /** Content. */
  readonly content: MultiAgentValue;
  /** Agent id. */
  readonly agentId: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Summary. */
  readonly summary: string;
}

/** Blackboard snapshot. */
export interface BlackboardSnapshot {
  /** Artifacts. */
  readonly artifacts: readonly BlackboardArtifact[];
  /** Decisions. */
  readonly decisions: readonly BlackboardArtifact[];
  /** Observations. */
  readonly observations: readonly BlackboardArtifact[];
}

/** Agent message. */
export interface AgentMessage {
  /** Message id. */
  readonly id: string;
  /** Type. */
  readonly type: MultiAgentMessageType;
  /** From agent id or supervisor. */
  readonly from: string;
  /** To agent id or broadcast. */
  readonly to: string;
  /** Session id. */
  readonly sessionId: string;
  /** Task id. */
  readonly taskId?: string;
  /** Content. */
  readonly content: MultiAgentValue;
  /** Timestamp. */
  readonly timestamp: number;
}

/** Audit event. */
export interface MultiAgentAuditEvent {
  /** Event id. */
  readonly id: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Agent id. */
  readonly agentId: string;
  /** Action. */
  readonly action: string;
  /** Allowed flag. */
  readonly allowed: boolean;
  /** Reason. */
  readonly reason: string;
  /** Details. */
  readonly details: Readonly<Record<string, MultiAgentValue>>;
}

/** Timeline event. */
export interface MultiAgentTimelineEvent {
  /** Event id. */
  readonly id: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Type. */
  readonly type: string;
  /** Message. */
  readonly message: string;
  /** Details. */
  readonly details?: Readonly<Record<string, MultiAgentValue>>;
}

/** Decision record. */
export interface MultiAgentDecision {
  /** Decision id. */
  readonly id: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Task id. */
  readonly taskId: string;
  /** Chosen agent id. */
  readonly agentId: string;
  /** Reason. */
  readonly reason: string;
  /** Alternatives. */
  readonly alternatives: readonly string[];
}

/** Approval request. */
export interface MultiAgentApprovalRequest {
  /** Approval id. */
  readonly id: string;
  /** Session id. */
  readonly sessionId: string;
  /** Task id. */
  readonly taskId: string;
  /** Agent id. */
  readonly agentId: string;
  /** Reason. */
  readonly reason: string;
  /** Risk. */
  readonly risk: 'high' | 'medium';
  /** Created timestamp. */
  readonly createdAt: number;
}

/** Approval decision. */
export interface MultiAgentApprovalDecision {
  /** Approval id. */
  readonly approvalId: string;
  /** Decision. */
  readonly decision: 'approved' | 'rejected';
  /** Optional comment. */
  readonly comment?: string;
}

/** Runtime metrics. */
export interface MultiAgentMetrics {
  /** Tokens used. */
  readonly tokenUsage: number;
  /** Cost units. */
  readonly cost: number;
  /** Completed tasks. */
  readonly completedTasks: number;
  /** Failed tasks. */
  readonly failedTasks: number;
  /** Runtime. */
  readonly runtimeMs: number;
}

/** Supervisor session. */
export interface MultiAgentSession {
  /** Session id. */
  readonly id: string;
  /** Goal. */
  readonly goal: MultiAgentGoalInput;
  /** Status. */
  readonly status: MultiAgentSessionStatus;
  /** Task graph. */
  readonly graph: MultiAgentTaskGraph;
  /** Outputs by task id. */
  readonly outputs: Readonly<Record<string, AgentTaskResult>>;
  /** Decisions. */
  readonly decisions: readonly MultiAgentDecision[];
  /** Timeline. */
  readonly timeline: readonly MultiAgentTimelineEvent[];
  /** Approval id. */
  readonly waitingApprovalId?: string;
  /** Metrics. */
  readonly metrics: MultiAgentMetrics;
  /** Created timestamp. */
  readonly createdAt: number;
  /** Updated timestamp. */
  readonly updatedAt: number;
  /** Dry-run flag. */
  readonly dryRun: boolean;
}

/** Final result. */
export interface MultiAgentFinalResult {
  /** Session id. */
  readonly sessionId: string;
  /** Status. */
  readonly status: MultiAgentSessionStatus;
  /** Summary. */
  readonly summary: string;
  /** Output. */
  readonly output: MultiAgentValue;
  /** Metrics. */
  readonly metrics: MultiAgentMetrics;
}

/** Planner contract. */
export interface MultiAgentPlanner {
  /** Plans a goal using available agents. */
  plan(
    goal: MultiAgentGoalInput,
    agents: readonly AgentDefinition[],
  ): Promise<MultiAgentTaskGraph>;
}

/** Runtime events. */
export interface MultiAgentRuntimeEvents {
  readonly 'multiAgent.approvalRequested': MultiAgentApprovalRequest;
  readonly 'multiAgent.completed': MultiAgentFinalResult;
  readonly 'multiAgent.failed': { readonly sessionId: string; readonly message: string };
  readonly 'multiAgent.message': AgentMessage;
  readonly 'multiAgent.started': { readonly sessionId: string; readonly goal: string };
  readonly 'multiAgent.taskAssigned': {
    readonly sessionId: string;
    readonly taskId: string;
    readonly agentId: string;
  };
  readonly 'multiAgent.taskCompleted': {
    readonly sessionId: string;
    readonly taskId: string;
    readonly agentId: string;
  };
  readonly 'multiAgent.taskFailed': {
    readonly sessionId: string;
    readonly taskId: string;
    readonly agentId: string;
    readonly message: string;
  };
}

/** Runtime error code. */
export type MultiAgentRuntimeErrorCode =
  | 'MULTI_AGENT_APPROVAL_REQUIRED'
  | 'MULTI_AGENT_BUDGET_EXCEEDED'
  | 'MULTI_AGENT_CONFLICT_UNRESOLVED'
  | 'MULTI_AGENT_INVALID_GOAL'
  | 'MULTI_AGENT_PERMISSION_DENIED'
  | 'MULTI_AGENT_SESSION_NOT_FOUND'
  | 'MULTI_AGENT_TASK_FAILED'
  | 'MULTI_AGENT_UNAVAILABLE';

/** Structured runtime error. */
export class MultiAgentRuntimeError extends Error {
  /** Stable code. */
  public readonly code: MultiAgentRuntimeErrorCode;

  /** Safe details. */
  public readonly details: Readonly<Record<string, MultiAgentValue>> | undefined;

  public constructor(
    code: MultiAgentRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, MultiAgentValue>>,
  ) {
    super(message);
    this.name = 'MultiAgentRuntimeError';
    this.code = code;
    this.details = details;
  }
}

/** Converts compatible agent values into multi-agent values. */
export function fromAgentValue(value: AgentValue): MultiAgentValue {
  return value;
}
