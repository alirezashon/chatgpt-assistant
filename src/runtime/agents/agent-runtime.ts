import { EventBus } from '@/runtime/events';

import { AgentGoalProcessor } from './agent-goal-processor';
import { AgentMemory, MemoryAgentMemoryStore, type AgentMemoryStore } from './agent-memory';
import { AgentObservationEngine } from './agent-observation-engine';
import { GoalOrientedAgentPlanner } from './agent-planner';
import { AgentReflectionEngine } from './agent-reflection-engine';
import { AgentSecurityManager } from './agent-security-manager';
import { MemoryAgentSessionStore, type AgentSessionStore } from './agent-session-store';
import { AgentStateManager } from './agent-state-manager';
import { AgentToolRegistry } from './agent-tool-registry';
import { AgentToolRuntime } from './agent-tool-runtime';
import type {
  AgentApprovalDecision,
  AgentDecision,
  AgentGoal,
  AgentGoalInput,
  AgentIdentity,
  AgentPlan,
  AgentPlanner,
  AgentResult,
  AgentRuntimeEvents,
  AgentSession,
  AgentTool,
  AgentValue,
} from './agent-types';
import { AgentRuntimeError } from './agent-types';

const DEFAULT_MAX_STEPS = 20;

/** Browser Agent Runtime dependencies. */
export interface AgentRuntimeDependencies {
  /** Optional event bus. */
  readonly events?: EventBus<AgentRuntimeEvents>;
  /** Optional planner. */
  readonly planner?: AgentPlanner;
  /** Optional session store. */
  readonly sessionStore?: AgentSessionStore;
  /** Optional memory store. */
  readonly memoryStore?: AgentMemoryStore;
  /** Maximum executed steps per session. */
  readonly maxSteps?: number;
}

/** Autonomous browser agent runtime. */
export class AgentRuntime {
  /** Agent event bus. */
  public readonly events: EventBus<AgentRuntimeEvents>;
  /** Tool registry. */
  public readonly tools = new AgentToolRegistry();
  /** Memory facade. */
  public readonly memory: AgentMemory;

  private readonly goals = new AgentGoalProcessor();
  private readonly planner: AgentPlanner;
  private readonly observations = new AgentObservationEngine();
  private readonly reflection = new AgentReflectionEngine();
  private readonly security = new AgentSecurityManager();
  private readonly state: AgentStateManager;
  private readonly toolRuntime: AgentToolRuntime;
  private readonly maxSteps: number;

  public constructor(dependencies: AgentRuntimeDependencies = {}) {
    this.events = dependencies.events ?? new EventBus<AgentRuntimeEvents>();
    this.planner = dependencies.planner ?? new GoalOrientedAgentPlanner();
    this.memory = new AgentMemory(dependencies.memoryStore ?? new MemoryAgentMemoryStore());
    this.state = new AgentStateManager(dependencies.sessionStore ?? new MemoryAgentSessionStore());
    this.toolRuntime = new AgentToolRuntime(
      this.tools,
      this.security,
      this.observations,
      this.events,
    );
    this.maxSteps = dependencies.maxSteps ?? DEFAULT_MAX_STEPS;
  }

  /** Registers a tool. */
  public registerTool(tool: AgentTool): void {
    this.tools.register(tool);
  }

  /** Starts a new autonomous agent session. */
  public async start(input: {
    readonly goal: AgentGoalInput;
    readonly identity: AgentIdentity;
    readonly dryRun?: boolean;
  }): Promise<AgentSession> {
    const goal = this.goals.process(input.goal);
    const memory = await this.memory.retrieve(goal.objective);
    const plan = await this.planner.plan(goal, memory, this.tools.metadata());
    let session = await this.createSession(input.identity, goal, plan, input.dryRun ?? false);
    await this.events.emit('agent.started', { goalId: goal.id, sessionId: session.id });
    session = await this.appendTimeline(
      session,
      'agent.started',
      `Agent session started: ${goal.objective}`,
    );
    return this.run(session);
  }

  /** Resumes a paused or waiting session. */
  public async resume(sessionId: string): Promise<AgentSession> {
    const session = await this.requireSession(sessionId);

    if (session.status === 'waiting-approval') {
      return session;
    }

    const running = await this.state.setStatus(session, 'running');
    return this.run(running);
  }

  /** Pauses a session. */
  public async pause(sessionId: string): Promise<AgentSession> {
    const session = await this.requireSession(sessionId);
    const paused = await this.state.setStatus(session, 'paused');
    await this.events.emit('agent.paused', { sessionId });
    return paused;
  }

  /** Cancels a session. */
  public async cancel(sessionId: string): Promise<AgentSession> {
    const session = await this.requireSession(sessionId);
    return this.state.setStatus(session, 'cancelled');
  }

  /** Modifies a goal and replans. */
  public async modifyGoal(sessionId: string, goal: AgentGoalInput): Promise<AgentSession> {
    const session = await this.requireSession(sessionId);
    const nextGoal = this.goals.process(goal);
    const plan = await this.planner.plan(
      nextGoal,
      await this.memory.retrieve(nextGoal.objective),
      this.tools.metadata(),
    );
    const next = {
      ...session,
      goal: nextGoal,
      plan,
      status: 'planning' as const,
      updatedAt: Date.now(),
    };
    await this.state.save(next);
    return this.run(next);
  }

  /** Applies a human approval decision and resumes execution. */
  public async approve(decision: AgentApprovalDecision): Promise<AgentSession> {
    const session = await this.findSessionByApproval(decision.approvalId);

    if (decision.decision === 'rejected') {
      const failed = await this.state.setStatus(session, 'failed');
      await this.events.emit('agent.failed', {
        message: decision.comment ?? 'Agent action rejected.',
        sessionId: failed.id,
      });
      return failed;
    }

    const step = session.plan.steps.find((item) => {
      const candidateToolName = item.toolNames[0];
      return (
        candidateToolName !== undefined &&
        `${session.id}:${item.id}:${candidateToolName}` === decision.approvalId
      );
    });

    if (step === undefined) {
      throw new AgentRuntimeError(
        'AGENT_APPROVAL_REQUIRED',
        `Approval step not found: ${decision.approvalId}`,
      );
    }

    const toolName = step.toolNames[0];

    if (toolName === undefined) {
      throw new AgentRuntimeError('AGENT_TOOL_NOT_FOUND', `Step has no tool: ${step.id}`);
    }

    const output = await this.tools.require(toolName).execute({
      dryRun: session.dryRun,
      input: decision.modifiedInput ?? step.input,
      sessionId: session.id,
      stepId: step.id,
    });
    let next = await this.state.setStatus(session, 'running');
    next = await this.recordToolSuccess(
      next,
      step.id,
      toolName,
      output.output,
      this.observations.observe(toolName, output),
    );
    return this.run(this.clearApproval(next));
  }

  /** Lists sessions. */
  public sessions(): Promise<readonly AgentSession[]> {
    return this.state.list();
  }

  /** Reads a session. */
  public getSession(sessionId: string): Promise<AgentSession | undefined> {
    return this.state.get(sessionId);
  }

  private async run(session: AgentSession): Promise<AgentSession> {
    let current = await this.state.setStatus(session, 'running');

    while (current.status === 'running') {
      this.security.assertWithinStepLimit(Object.keys(current.outputs).length, current.maxSteps);
      const step = current.plan.steps.find(
        (candidate) => current.outputs[candidate.id] === undefined,
      );

      if (step === undefined) {
        return this.complete(current);
      }

      current = await this.executeStep(current, step.id);

      if (
        current.status === 'waiting-approval' ||
        current.status === 'failed' ||
        current.status === 'paused'
      ) {
        return current;
      }
    }

    return current;
  }

  private async executeStep(session: AgentSession, stepId: string): Promise<AgentSession> {
    const step = session.plan.steps.find((candidate) => candidate.id === stepId);

    if (step === undefined) {
      throw new AgentRuntimeError('AGENT_TOOL_FAILED', `Agent step not found: ${stepId}`);
    }

    const toolName = this.selectTool(step.toolNames);
    const tool = this.tools.require(toolName);
    this.security.assertToolAllowed(session.goal, tool.metadata);

    let next = {
      ...session,
      currentStepId: step.id,
      updatedAt: Date.now(),
    };
    await this.state.save(next);
    await this.events.emit('agent.stepStarted', { sessionId: next.id, stepId: step.id });

    const decision: AgentDecision = {
      expectedOutcome: step.successCriteria.join('; '),
      id: crypto.randomUUID(),
      reason: `Selected ${toolName} for step objective: ${step.objective}`,
      stepId: step.id,
      timestamp: Date.now(),
      toolName,
    };
    next = {
      ...next,
      decisions: [...next.decisions, decision],
    };
    await this.state.save(next);
    await this.events.emit('agent.decision', decision);

    const result = await this.toolRuntime.execute(toolName, next.goal, {
      dryRun: next.dryRun,
      input: step.input,
      sessionId: next.id,
      stepId: step.id,
    });

    if ('approval' in result) {
      const waiting = {
        ...next,
        status: 'waiting-approval' as const,
        waitingApprovalId: result.approval.id,
        updatedAt: Date.now(),
      };
      await this.state.save(waiting);
      return waiting;
    }

    if (!this.reflection.stepSucceeded(result.observation)) {
      return this.recover(next, this.reflection.recoveryReason(next, result.observation));
    }

    return this.recordToolSuccess(
      next,
      step.id,
      toolName,
      result.response.output,
      result.observation,
    );
  }

  private async recover(session: AgentSession, reason: string): Promise<AgentSession> {
    const failureCount = session.failureCount + 1;

    if (failureCount >= 3) {
      const failed = await this.state.setStatus({ ...session, failureCount }, 'failed');
      await this.events.emit('agent.failed', { message: reason, sessionId: failed.id });
      return failed;
    }

    const plan = await this.planner.replan(
      { ...session, failureCount },
      reason,
      this.tools.metadata(),
    );
    const replanned = {
      ...session,
      failureCount,
      plan,
      updatedAt: Date.now(),
    };
    await this.state.save(replanned);
    return this.run(replanned);
  }

  private async recordToolSuccess(
    session: AgentSession,
    stepId: string,
    toolName: string,
    output: AgentValue,
    observation: ReturnType<AgentObservationEngine['observe']>,
  ): Promise<AgentSession> {
    let next = await this.state.recordObservation(session, stepId, observation, output);
    await this.events.emit('agent.observed', { ...observation, sessionId: next.id });
    await this.memory.remember({
      scope: 'session',
      sessionId: next.id,
      summary: `${toolName}: ${observation.summary}`,
      value: output,
    });
    next = await this.appendTimeline(next, 'agent.observed', observation.summary, {
      stepId,
      toolName,
    });
    return next;
  }

  private async complete(session: AgentSession): Promise<AgentSession> {
    const completed = await this.state.setStatus(session, 'completed');
    const result: AgentResult = {
      output: completed.outputs,
      sessionId: completed.id,
      status: completed.status,
      summary: `Completed goal: ${completed.goal.objective}`,
    };
    await this.events.emit('agent.completed', result);
    return this.appendTimeline(completed, 'agent.completed', result.summary);
  }

  private async createSession(
    identity: AgentIdentity,
    goal: AgentGoal,
    plan: AgentPlan,
    dryRun: boolean,
  ): Promise<AgentSession> {
    const now = Date.now();
    const session: AgentSession = {
      createdAt: now,
      decisions: [],
      dryRun,
      failureCount: 0,
      goal,
      id: crypto.randomUUID(),
      identity,
      maxSteps: this.maxSteps,
      observations: [],
      outputs: {},
      plan,
      status: 'planning',
      timeline: [],
      updatedAt: now,
    };
    await this.state.save(session);
    return session;
  }

  private selectTool(toolNames: readonly string[]): string {
    const toolName = toolNames.find(
      (name) => this.tools.get(name)?.metadata.availability !== 'unavailable',
    );

    if (toolName === undefined) {
      throw new AgentRuntimeError('AGENT_TOOL_NOT_FOUND', 'No available tool for agent step.');
    }

    return toolName;
  }

  private async appendTimeline(
    session: AgentSession,
    type: string,
    message: string,
    details?: Readonly<Record<string, AgentValue>>,
  ): Promise<AgentSession> {
    const next = await this.state.appendTimeline(session, {
      ...(details === undefined ? {} : { details }),
      message,
      type,
    });
    const event = next.timeline[next.timeline.length - 1];

    if (event !== undefined) {
      await this.events.emit('agent.timeline', { ...event, sessionId: next.id });
    }

    return next;
  }

  private clearApproval(session: AgentSession): AgentSession {
    return {
      createdAt: session.createdAt,
      ...(session.currentStepId === undefined ? {} : { currentStepId: session.currentStepId }),
      decisions: session.decisions,
      dryRun: session.dryRun,
      failureCount: session.failureCount,
      goal: session.goal,
      id: session.id,
      identity: session.identity,
      maxSteps: session.maxSteps,
      observations: session.observations,
      outputs: session.outputs,
      plan: session.plan,
      status: session.status,
      timeline: session.timeline,
      updatedAt: session.updatedAt,
    };
  }

  private async requireSession(sessionId: string): Promise<AgentSession> {
    const session = await this.state.get(sessionId);

    if (session === undefined) {
      throw new AgentRuntimeError(
        'AGENT_SESSION_NOT_FOUND',
        `Agent session not found: ${sessionId}`,
      );
    }

    return session;
  }

  private async findSessionByApproval(approvalId: string): Promise<AgentSession> {
    const sessions = await this.state.list();
    const session = sessions.find((item) => item.waitingApprovalId === approvalId);

    if (session === undefined) {
      throw new AgentRuntimeError('AGENT_APPROVAL_REQUIRED', `Approval not found: ${approvalId}`);
    }

    return session;
  }
}
