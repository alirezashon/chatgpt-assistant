import { EventBus } from '@/runtime/events';

import { MultiAgentRegistry, type RegisteredAgent } from './agent-registry';
import { SharedBlackboard } from './blackboard';
import { AgentCommunicationLog } from './communication';
import { AgentConflictResolver } from './conflict-resolver';
import { MultiAgentPermissionManager } from './permission-manager';
import { DeterministicMultiAgentPlanner } from './planner';
import type {
  AgentTaskResult,
  MultiAgentApprovalDecision,
  MultiAgentApprovalRequest,
  MultiAgentBudget,
  MultiAgentFinalResult,
  MultiAgentGoalInput,
  MultiAgentMetrics,
  MultiAgentPlanner,
  MultiAgentRuntimeEvents,
  MultiAgentSession,
  MultiAgentTask,
  MultiAgentTaskGraph,
  MultiAgentTaskStatus,
  MultiAgentTimelineEvent,
  MultiAgentValue,
} from './multi-agent-types';
import { MultiAgentRuntimeError } from './multi-agent-types';

const DEFAULT_BUDGET: MultiAgentBudget = {
  maxCost: 100,
  maxRuntimeMs: 120_000,
  maxTokens: 100_000,
};

/** Supervisor runtime dependencies. */
export interface SupervisorRuntimeDependencies {
  /** Event bus. */
  readonly events?: EventBus<MultiAgentRuntimeEvents>;
  /** Agent registry. */
  readonly registry?: MultiAgentRegistry;
  /** Blackboard. */
  readonly blackboard?: SharedBlackboard;
  /** Communication log. */
  readonly communication?: AgentCommunicationLog;
  /** Permission manager. */
  readonly permissions?: MultiAgentPermissionManager;
  /** Planner. */
  readonly planner?: MultiAgentPlanner;
  /** Maximum concurrent task executions. */
  readonly maxParallelAgents?: number;
}

interface PendingApproval {
  readonly agentId: string;
  readonly sessionId: string;
  readonly taskId: string;
}

/** Production-grade supervisor for multi-agent planning, delegation, coordination, and recovery. */
export class SupervisorRuntime {
  /** Runtime events. */
  public readonly events: EventBus<MultiAgentRuntimeEvents>;
  /** Dynamic agent registry. */
  public readonly registry: MultiAgentRegistry;
  /** Shared collaborative workspace. */
  public readonly blackboard: SharedBlackboard;
  /** Agent communication log. */
  public readonly communication: AgentCommunicationLog;
  /** Permission and audit manager. */
  public readonly permissions: MultiAgentPermissionManager;

  private readonly conflictResolver = new AgentConflictResolver();
  private readonly maxParallelAgents: number;
  private readonly planner: MultiAgentPlanner;
  private readonly sessions = new Map<string, MultiAgentSession>();
  private readonly approvedTasks = new Set<string>();
  private readonly pendingApprovals = new Map<string, PendingApproval>();

  public constructor(dependencies: SupervisorRuntimeDependencies = {}) {
    this.events = dependencies.events ?? new EventBus<MultiAgentRuntimeEvents>();
    this.registry = dependencies.registry ?? new MultiAgentRegistry();
    this.blackboard = dependencies.blackboard ?? new SharedBlackboard();
    this.communication = dependencies.communication ?? new AgentCommunicationLog();
    this.permissions = dependencies.permissions ?? new MultiAgentPermissionManager();
    this.planner = dependencies.planner ?? new DeterministicMultiAgentPlanner();
    this.maxParallelAgents = dependencies.maxParallelAgents ?? 3;
  }

  /** Starts, plans, and runs a supervised multi-agent session. */
  public async start(input: {
    readonly dryRun?: boolean;
    readonly goal: MultiAgentGoalInput;
  }): Promise<MultiAgentSession> {
    const graph = await this.planner.plan(input.goal, this.registry.definitions());
    const session = this.save(
      appendTimeline(
        {
          createdAt: Date.now(),
          decisions: [],
          dryRun: input.dryRun ?? false,
          goal: input.goal,
          graph,
          id: crypto.randomUUID(),
          metrics: emptyMetrics(),
          outputs: {},
          status: 'planning',
          timeline: [],
          updatedAt: Date.now(),
        },
        'multiAgent.started',
        `Supervisor started: ${input.goal.objective}`,
      ),
    );

    await this.events.emit('multiAgent.started', {
      goal: input.goal.objective,
      sessionId: session.id,
    });

    return this.run({ ...session, status: 'running', updatedAt: Date.now() });
  }

  /** Approves or rejects a waiting high-risk task and resumes execution. */
  public async approve(decision: MultiAgentApprovalDecision): Promise<MultiAgentSession> {
    const pending = this.pendingApprovals.get(decision.approvalId);

    if (pending === undefined) {
      throw new MultiAgentRuntimeError(
        'MULTI_AGENT_APPROVAL_REQUIRED',
        `Approval not found: ${decision.approvalId}`,
      );
    }

    const session = this.requireSession(pending.sessionId);

    if (decision.decision === 'rejected') {
      const failed = this.save({
        ...session,
        graph: updateTask(session.graph, pending.taskId, {
          error: decision.comment ?? 'Human rejected task approval.',
          status: 'failed',
        }),
        status: 'failed',
        updatedAt: Date.now(),
      });
      await this.events.emit('multiAgent.failed', {
        message: decision.comment ?? 'Human rejected task approval.',
        sessionId: failed.id,
      });
      return failed;
    }

    this.approvedTasks.add(`${pending.sessionId}:${pending.taskId}`);
    this.pendingApprovals.delete(decision.approvalId);
    const running = stripApproval({
      ...session,
      status: 'running',
      updatedAt: Date.now(),
    });
    return this.run(running);
  }

  /** Pauses a session. */
  public pause(sessionId: string): MultiAgentSession {
    return this.save({ ...this.requireSession(sessionId), status: 'paused', updatedAt: Date.now() });
  }

  /** Cancels a session. */
  public cancel(sessionId: string): MultiAgentSession {
    return this.save({ ...this.requireSession(sessionId), status: 'cancelled', updatedAt: Date.now() });
  }

  /** Lists sessions. */
  public listSessions(): readonly MultiAgentSession[] {
    return [...this.sessions.values()];
  }

  /** Reads a session. */
  public getSession(sessionId: string): MultiAgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /** Returns final result if complete. */
  public finalResult(sessionId: string): MultiAgentFinalResult {
    const session = this.requireSession(sessionId);

    return {
      metrics: session.metrics,
      output: serializeOutputs(session.outputs),
      sessionId: session.id,
      status: session.status,
      summary: summarize(session),
    };
  }

  private async run(session: MultiAgentSession): Promise<MultiAgentSession> {
    let current = this.save({ ...session, status: 'running', updatedAt: Date.now() });

    while (current.status === 'running') {
      this.assertWithinBudget(current);
      const ready = readyTasks(current.graph, current.outputs);

      if (ready.length === 0) {
        if (current.graph.tasks.every((task) => task.status === 'succeeded')) {
          return this.complete(current);
        }

        const failed = current.graph.tasks.find((task) => task.status === 'failed');
        if (failed !== undefined) {
          return this.fail(current, failed.error ?? `Task failed: ${failed.title}`);
        }

        return this.save({ ...current, status: 'paused', updatedAt: Date.now() });
      }

      const batch = ready.slice(0, Math.max(1, this.maxParallelAgents));
      const next = await this.executeBatch(current, batch);

      if (next.status === 'waiting-approval' || next.status === 'failed') {
        return next;
      }

      current = next;
    }

    return current;
  }

  private async executeBatch(
    session: MultiAgentSession,
    tasks: readonly MultiAgentTask[],
  ): Promise<MultiAgentSession> {
    const executions = await Promise.all(tasks.map((task) => this.executeTask(session, task)));
    return executions.reduce((current, update) => mergeSession(current, update), this.requireSession(session.id));
  }

  private async executeTask(session: MultiAgentSession, task: MultiAgentTask): Promise<MultiAgentSession> {
    const candidates = this.selectCandidates(task);
    const primary = candidates[0];

    if (primary === undefined) {
      return this.markTaskFailed(session, task, 'No capable agent is available.');
    }

    if (this.permissions.requiresApproval(task) && !this.approvedTasks.has(`${session.id}:${task.id}`)) {
      return this.requestApproval(session, task, primary.definition.id);
    }

    const runningTask = {
      ...task,
      assignedAgentId: primary.definition.id,
      attempts: task.attempts + 1,
      status: 'running' as const,
    };
    let current = this.save({
      ...session,
      graph: replaceTask(session.graph, runningTask),
      updatedAt: Date.now(),
    });

    await this.events.emit('multiAgent.taskAssigned', {
      agentId: primary.definition.id,
      sessionId: current.id,
      taskId: task.id,
    });
    this.sendStatus(current.id, task.id, primary.definition.id, `Assigned ${task.title}.`);

    const selectedCandidates = shouldUseMultipleAgents(task) ? candidates.slice(0, 2) : [primary];
    const results: { readonly agentId: string; readonly result: AgentTaskResult }[] = [];

    for (const candidate of selectedCandidates) {
      try {
        this.permissions.assertTaskAllowed(candidate.definition, runningTask);
        results.push({
          agentId: candidate.definition.id,
          result: await withTimeout(
            candidate.executor.execute({
              agent: candidate.definition,
              blackboard: this.blackboard.snapshot(candidate.definition.profile.allowedActions),
              dryRun: current.dryRun,
              goal: current.goal,
              messages: this.communication.list(current.id, candidate.definition.id),
              sessionId: current.id,
              task: runningTask,
            }),
            runningTask.timeoutMs,
            `Task timed out: ${runningTask.title}`,
          ),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.sendStatus(current.id, task.id, candidate.definition.id, message);
      }
    }

    if (results.length === 0) {
      return this.recoverTask(current, runningTask, 'All candidate agents failed.');
    }

    const resolved = this.conflictResolver.resolve({ candidates: results, task: runningTask });
    current = this.save({
      ...current,
      decisions: [...current.decisions, resolved.decision],
      updatedAt: Date.now(),
    });

    if (!resolved.result.success || resolved.result.confidence < 0.35) {
      return this.recoverTask(current, runningTask, resolved.result.summary);
    }

    this.blackboard.write({
      agentId: resolved.decision.agentId,
      content: resolved.result.output,
      kind: 'task-output',
      permissions: ['blackboard.read'],
      summary: resolved.result.summary,
      taskId: runningTask.id,
    });
    this.sendStatus(current.id, task.id, resolved.decision.agentId, resolved.result.summary);
    await this.events.emit('multiAgent.taskCompleted', {
      agentId: resolved.decision.agentId,
      sessionId: current.id,
      taskId: task.id,
    });

    return this.save(
      appendTimeline(
        {
          ...current,
          graph: updateTask(current.graph, task.id, {
            assignedAgentId: resolved.decision.agentId,
            status: 'succeeded',
          }),
          metrics: addMetrics(current.metrics, resolved.result),
          outputs: {
            ...current.outputs,
            [task.id]: resolved.result,
          },
          updatedAt: Date.now(),
        },
        'multiAgent.taskCompleted',
        `${task.title}: ${resolved.result.summary}`,
        {
          agentId: resolved.decision.agentId,
          taskId: task.id,
        },
      ),
    );
  }

  private selectCandidates(task: MultiAgentTask): readonly RegisteredAgent[] {
    return [...this.registry.capable(task.requiredCapabilities)]
      .sort(
        (left, right) =>
          right.definition.profile.health.successRate - left.definition.profile.health.successRate ||
          left.definition.profile.costModel.baseCost - right.definition.profile.costModel.baseCost ||
          left.definition.profile.health.latencyMs - right.definition.profile.health.latencyMs,
      );
  }

  private async recoverTask(
    session: MultiAgentSession,
    task: MultiAgentTask,
    reason: string,
  ): Promise<MultiAgentSession> {
    if (task.attempts < task.maxAttempts) {
      return this.save(
        appendTimeline(
          {
            ...session,
            graph: updateTask(session.graph, task.id, {
              error: reason,
              status: 'pending',
            }),
            updatedAt: Date.now(),
          },
          'multiAgent.taskRetry',
          `Retrying ${task.title}: ${reason}`,
          { taskId: task.id },
        ),
      );
    }

    return this.markTaskFailed(session, task, reason);
  }

  private async markTaskFailed(
    session: MultiAgentSession,
    task: MultiAgentTask,
    reason: string,
  ): Promise<MultiAgentSession> {
    const agentId = task.assignedAgentId ?? 'unassigned';
    await this.events.emit('multiAgent.taskFailed', {
      agentId,
      message: reason,
      sessionId: session.id,
      taskId: task.id,
    });
    return this.save(
      appendTimeline(
        {
          ...session,
          graph: updateTask(session.graph, task.id, {
            error: reason,
            status: 'failed',
          }),
          metrics: {
            ...session.metrics,
            failedTasks: session.metrics.failedTasks + 1,
          },
          updatedAt: Date.now(),
        },
        'multiAgent.taskFailed',
        `${task.title}: ${reason}`,
        { taskId: task.id },
      ),
    );
  }

  private requestApproval(
    session: MultiAgentSession,
    task: MultiAgentTask,
    agentId: string,
  ): MultiAgentSession {
    const approval: MultiAgentApprovalRequest = {
      agentId,
      createdAt: Date.now(),
      id: `${session.id}:${task.id}:approval`,
      reason: `Task requires elevated permissions: ${task.permissions.join(', ')}`,
      risk: task.permissions.includes('tool.deploy') ? 'high' : 'medium',
      sessionId: session.id,
      taskId: task.id,
    };
    this.pendingApprovals.set(approval.id, {
      agentId,
      sessionId: session.id,
      taskId: task.id,
    });
    void this.events.emit('multiAgent.approvalRequested', approval);
    return this.save({
      ...session,
      graph: updateTask(session.graph, task.id, {
        assignedAgentId: agentId,
        status: 'waiting-approval',
      }),
      status: 'waiting-approval',
      updatedAt: Date.now(),
      waitingApprovalId: approval.id,
    });
  }

  private async complete(session: MultiAgentSession): Promise<MultiAgentSession> {
    const completed = this.save(
      appendTimeline(
        {
          ...session,
          metrics: {
            ...session.metrics,
            runtimeMs: Date.now() - session.createdAt,
          },
          status: 'completed',
          updatedAt: Date.now(),
        },
        'multiAgent.completed',
        summarize(session),
      ),
    );
    await this.events.emit('multiAgent.completed', this.finalResult(completed.id));
    return completed;
  }

  private async fail(session: MultiAgentSession, message: string): Promise<MultiAgentSession> {
    const failed = this.save({
      ...session,
      status: 'failed',
      updatedAt: Date.now(),
    });
    await this.events.emit('multiAgent.failed', {
      message,
      sessionId: failed.id,
    });
    return failed;
  }

  private assertWithinBudget(session: MultiAgentSession): void {
    const budget = session.goal.budget ?? DEFAULT_BUDGET;

    if (
      session.metrics.cost > budget.maxCost ||
      session.metrics.tokenUsage > budget.maxTokens ||
      Date.now() - session.createdAt > budget.maxRuntimeMs
    ) {
      throw new MultiAgentRuntimeError('MULTI_AGENT_BUDGET_EXCEEDED', 'Multi-agent budget exceeded.', {
        sessionId: session.id,
      });
    }
  }

  private sendStatus(sessionId: string, taskId: string, agentId: string, summary: string): void {
    const message = this.communication.send({
      content: { summary },
      from: agentId,
      sessionId,
      taskId,
      to: 'supervisor',
      type: 'status',
    });
    void this.events.emit('multiAgent.message', message);
  }

  private save(session: MultiAgentSession): MultiAgentSession {
    this.sessions.set(session.id, session);
    return session;
  }

  private requireSession(sessionId: string): MultiAgentSession {
    const session = this.sessions.get(sessionId);

    if (session === undefined) {
      throw new MultiAgentRuntimeError(
        'MULTI_AGENT_SESSION_NOT_FOUND',
        `Multi-agent session not found: ${sessionId}`,
      );
    }

    return session;
  }
}

function readyTasks(
  graph: MultiAgentTaskGraph,
  outputs: Readonly<Record<string, AgentTaskResult>>,
): readonly MultiAgentTask[] {
  return graph.tasks
    .filter((task) => task.status === 'pending')
    .filter((task) => task.dependencies.every((dependency) => outputs[dependency] !== undefined))
    .sort((left, right) => right.priority - left.priority);
}

function shouldUseMultipleAgents(task: MultiAgentTask): boolean {
  return task.strategy === 'competitive' || task.strategy === 'debate' || task.strategy === 'consensus';
}

function replaceTask(graph: MultiAgentTaskGraph, task: MultiAgentTask): MultiAgentTaskGraph {
  return {
    ...graph,
    tasks: graph.tasks.map((candidate) => (candidate.id === task.id ? task : candidate)),
  };
}

function updateTask(
  graph: MultiAgentTaskGraph,
  taskId: string,
  patch: {
    readonly assignedAgentId?: string;
    readonly error?: string;
    readonly status: MultiAgentTaskStatus;
  },
): MultiAgentTaskGraph {
  return {
    ...graph,
    tasks: graph.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            ...(patch.assignedAgentId === undefined ? {} : { assignedAgentId: patch.assignedAgentId }),
            ...(patch.error === undefined ? {} : { error: patch.error }),
            status: patch.status,
          }
        : task,
    ),
  };
}

function appendTimeline(
  session: MultiAgentSession,
  type: string,
  message: string,
  details?: Readonly<Record<string, MultiAgentValue>>,
): MultiAgentSession {
  const event: MultiAgentTimelineEvent = {
    ...(details === undefined ? {} : { details }),
    id: crypto.randomUUID(),
    message,
    timestamp: Date.now(),
    type,
  };

  return {
    ...session,
    timeline: [...session.timeline, event],
  };
}

function mergeSession(left: MultiAgentSession, right: MultiAgentSession): MultiAgentSession {
  const outputs = {
    ...left.outputs,
    ...right.outputs,
  };
  const tasks = left.graph.tasks.map((leftTask) => {
    const rightTask = right.graph.tasks.find((candidate) => candidate.id === leftTask.id);
    return chooseTaskState(leftTask, rightTask ?? leftTask);
  });

  return {
    ...right,
    graph: {
      ...right.graph,
      tasks,
    },
    decisions: [...left.decisions, ...right.decisions.filter((decision) => !left.decisions.some((item) => item.id === decision.id))],
    metrics: metricsFromOutputs(outputs, tasks, left.createdAt),
    outputs,
    timeline: [...left.timeline, ...right.timeline.filter((event) => !left.timeline.some((item) => item.id === event.id))],
  };
}

function chooseTaskState(left: MultiAgentTask, right: MultiAgentTask): MultiAgentTask {
  return taskStatusRank(right.status) >= taskStatusRank(left.status) ? right : left;
}

function taskStatusRank(status: MultiAgentTaskStatus): number {
  switch (status) {
    case 'succeeded':
      return 6;
    case 'failed':
      return 5;
    case 'waiting-approval':
      return 4;
    case 'running':
      return 3;
    case 'blocked':
      return 2;
    case 'cancelled':
      return 1;
    case 'pending':
      return 0;
  }
}

function addMetrics(metrics: MultiAgentMetrics, result: AgentTaskResult): MultiAgentMetrics {
  return {
    completedTasks: metrics.completedTasks + 1,
    cost: metrics.cost + result.cost,
    failedTasks: metrics.failedTasks,
    runtimeMs: metrics.runtimeMs,
    tokenUsage: metrics.tokenUsage + result.tokenUsage,
  };
}

function emptyMetrics(): MultiAgentMetrics {
  return {
    completedTasks: 0,
    cost: 0,
    failedTasks: 0,
    runtimeMs: 0,
    tokenUsage: 0,
  };
}

function metricsFromOutputs(
  outputs: Readonly<Record<string, AgentTaskResult>>,
  tasks: readonly MultiAgentTask[],
  createdAt: number,
): MultiAgentMetrics {
  const results = Object.values(outputs);

  return {
    completedTasks: results.length,
    cost: results.reduce((sum, result) => sum + result.cost, 0),
    failedTasks: tasks.filter((task) => task.status === 'failed').length,
    runtimeMs: Date.now() - createdAt,
    tokenUsage: results.reduce((sum, result) => sum + result.tokenUsage, 0),
  };
}

function stripApproval(session: MultiAgentSession): MultiAgentSession {
  return {
    createdAt: session.createdAt,
    decisions: session.decisions,
    dryRun: session.dryRun,
    goal: session.goal,
    graph: {
      ...session.graph,
      tasks: session.graph.tasks.map((task) =>
        task.status === 'waiting-approval' ? { ...task, status: 'pending' } : task,
      ),
    },
    id: session.id,
    metrics: session.metrics,
    outputs: session.outputs,
    status: session.status,
    timeline: session.timeline,
    updatedAt: session.updatedAt,
  };
}

function serializeOutputs(outputs: Readonly<Record<string, AgentTaskResult>>): MultiAgentValue {
  const serialized: Record<string, MultiAgentValue> = {};

  for (const [taskId, result] of Object.entries(outputs)) {
    serialized[taskId] = {
      confidence: result.confidence,
      cost: result.cost,
      issues: result.issues,
      output: result.output,
      quality: result.quality,
      summary: result.summary,
      success: result.success,
      tokenUsage: result.tokenUsage,
    };
  }

  return serialized;
}

function summarize(session: MultiAgentSession): string {
  const completed = Object.keys(session.outputs).length;
  return `Completed ${completed.toString()} of ${session.graph.tasks.length.toString()} supervised tasks for: ${session.goal.objective}`;
}

function withTimeout<Result>(promise: Promise<Result>, timeoutMs: number, message: string): Promise<Result> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new MultiAgentRuntimeError('MULTI_AGENT_TASK_FAILED', message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  });
}
