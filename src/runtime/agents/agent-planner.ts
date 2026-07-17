import type {
  AgentGoal,
  AgentMemoryEntry,
  AgentPlan,
  AgentPlanner,
  AgentToolMetadata,
} from './agent-types';
import { AgentRuntimeError } from './agent-types';

/** Deterministic goal-oriented planner used when no AI planner is configured. */
export class GoalOrientedAgentPlanner implements AgentPlanner {
  /** Creates a plan by matching goal text to available tools. */
  public plan(
    goal: AgentGoal,
    _memory: readonly AgentMemoryEntry[],
    tools: readonly AgentToolMetadata[],
  ): Promise<AgentPlan> {
    const selected = selectTools(goal, tools);

    if (selected.length === 0) {
      throw new AgentRuntimeError(
        'AGENT_TOOL_NOT_FOUND',
        'No available tools can satisfy the goal.',
      );
    }

    return Promise.resolve({
      fallbackStrategy: 'If a tool fails, choose the next available lower-risk tool and replan.',
      goalId: goal.id,
      id: crypto.randomUUID(),
      steps: selected.map((tool, index) => ({
        dependsOn: index === 0 ? [] : [`step-${index.toString()}`],
        id: `step-${(index + 1).toString()}`,
        input: {
          objective: goal.objective,
          expectedOutput: goal.expectedOutput,
        },
        objective: `Use ${tool.name} for: ${goal.objective}`,
        parallelizable: false,
        successCriteria: goal.successCriteria,
        toolNames: [tool.name],
      })),
      strategy: 'Use the safest available tools that match the goal objective.',
      version: 1,
    });
  }

  /** Replans by removing tools that already failed when possible. */
  public replan(
    session: Parameters<AgentPlanner['replan']>[0],
    reason: string,
    tools: readonly AgentToolMetadata[],
  ): Promise<AgentPlan> {
    const failedToolNames = new Set(session.decisions.map((decision) => decision.toolName));
    const alternatives = tools.filter((tool) => !failedToolNames.has(tool.name));
    const available = alternatives.length > 0 ? alternatives : tools;

    return Promise.resolve({
      fallbackStrategy: 'Escalate to human control if the revised plan fails.',
      goalId: session.goal.id,
      id: crypto.randomUUID(),
      steps: [
        {
          dependsOn: [],
          id: `recovery-${(session.failureCount + 1).toString()}`,
          input: {
            objective: session.goal.objective,
            reason,
          },
          objective: `Recover from failure: ${reason}`,
          parallelizable: false,
          successCriteria: session.goal.successCriteria,
          toolNames: available.slice(0, 1).map((tool) => tool.name),
        },
      ],
      strategy: `Replanned because: ${reason}`,
      version: session.plan.version + 1,
    });
  }
}

function selectTools(
  goal: AgentGoal,
  tools: readonly AgentToolMetadata[],
): readonly AgentToolMetadata[] {
  const objective = goal.objective.toLowerCase();
  const available = tools
    .filter((tool) => tool.availability === 'available' || tool.availability === 'degraded')
    .sort(
      (left, right) =>
        riskScore(left.risk) - riskScore(right.risk) ||
        left.cost - right.cost ||
        left.latencyMs - right.latencyMs,
    );
  const matching = available.filter((tool) =>
    `${tool.name} ${tool.description}`
      .toLowerCase()
      .split(/\s+/)
      .some((term) => objective.includes(term)),
  );

  return (matching.length > 0 ? matching : available).slice(0, 4);
}

function riskScore(risk: AgentToolMetadata['risk']): number {
  if (risk === 'low') {
    return 0;
  }

  if (risk === 'medium') {
    return 1;
  }

  return 2;
}
