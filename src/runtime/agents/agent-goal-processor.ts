import type { AgentGoal, AgentGoalInput, AgentPermission } from './agent-types';
import { AgentRuntimeError } from './agent-types';

const DEFAULT_PERMISSIONS: readonly AgentPermission[] = [
  'ai.request',
  'memory.read',
  'memory.write',
];

/** Converts natural language or structured input into a normalized agent goal. */
export class AgentGoalProcessor {
  /** Normalizes a goal input. */
  public process(input: AgentGoalInput): AgentGoal {
    const normalized =
      typeof input === 'string'
        ? {
            objective: input,
          }
        : input;

    const objective = normalized.objective.trim();

    if (objective.length === 0) {
      throw new AgentRuntimeError('AGENT_GOAL_INVALID', 'Agent goal objective cannot be empty.');
    }

    return {
      ...(normalized.deadlineAt === undefined ? {} : { deadlineAt: normalized.deadlineAt }),
      constraints: normalized.constraints ?? [],
      expectedOutput: normalized.expectedOutput ?? inferExpectedOutput(objective),
      id: crypto.randomUUID(),
      objective,
      permissions: normalized.permissions ?? DEFAULT_PERMISSIONS,
      preferences: normalized.preferences ?? {},
      successCriteria: normalized.successCriteria ?? inferSuccessCriteria(objective),
    };
  }
}

function inferExpectedOutput(objective: string): string {
  if (objective.toLowerCase().includes('report')) {
    return 'A structured report with sources, summary, and recommended next steps.';
  }

  return 'A completed result that satisfies the objective.';
}

function inferSuccessCriteria(objective: string): readonly string[] {
  return [
    `Objective addressed: ${objective}`,
    'Result is internally consistent.',
    'Required risky actions received approval.',
  ];
}
