import type {
  AgentDefinition,
  MultiAgentExecutionStrategy,
  MultiAgentGoalInput,
  MultiAgentPermission,
  MultiAgentPlanner,
  MultiAgentTask,
  MultiAgentTaskGraph,
} from './multi-agent-types';
import { MultiAgentRuntimeError } from './multi-agent-types';

/** Deterministic planner that turns goals into graph tasks based on available agent capabilities. */
export class DeterministicMultiAgentPlanner implements MultiAgentPlanner {
  /** Plans a goal using conservative product-engineering phases. */
  public plan(
    goal: MultiAgentGoalInput,
    agents: readonly AgentDefinition[],
  ): Promise<MultiAgentTaskGraph> {
    if (goal.objective.trim().length === 0) {
      throw new MultiAgentRuntimeError('MULTI_AGENT_INVALID_GOAL', 'Goal objective cannot be empty.');
    }

    const objective = goal.objective.toLowerCase();
    const templates = objective.includes('build') || objective.includes('complete') ? buildTemplates() : defaultTemplates();
    const availableCapabilities = new Set(
      agents.flatMap((agent) => agent.profile.capabilities.map((capability) => capability.id)),
    );
    const tasks = templates
      .filter((template) => template.requiredCapabilities.some((capability) => availableCapabilities.has(capability)))
      .map((template): MultiAgentTask => ({
        attempts: 0,
        constraints: goal.constraints ?? [],
        dependencies: template.dependencies,
        description: `${template.description}\nGoal: ${goal.objective}`,
        ...(goal.deadlineAt === undefined ? {} : { deadlineAt: goal.deadlineAt }),
        id: template.id,
        maxAttempts: 2,
        permissions: template.permissions,
        priority: template.priority,
        requiredCapabilities: template.requiredCapabilities,
        status: 'pending',
        strategy: template.strategy,
        successCriteria: goal.successCriteria ?? [`Complete ${template.title.toLowerCase()}`],
        timeoutMs: 30_000,
        title: template.title,
      }));

    if (tasks.length === 0) {
      throw new MultiAgentRuntimeError('MULTI_AGENT_UNAVAILABLE', 'No registered agents can satisfy this goal.');
    }

    return Promise.resolve({
      id: crypto.randomUUID(),
      strategy: goal.strategy ?? 'parallel',
      tasks,
    });
  }
}

interface TaskTemplate {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly requiredCapabilities: readonly string[];
  readonly dependencies: readonly string[];
  readonly priority: number;
  readonly strategy: MultiAgentExecutionStrategy;
  readonly permissions: readonly MultiAgentPermission[];
}

function buildTemplates(): readonly TaskTemplate[] {
  return [
    {
      dependencies: [],
      description: 'Research relevant context, competitors, references, and constraints.',
      id: 'research',
      permissions: ['knowledge.read', 'network.request', 'blackboard.write'],
      priority: 100,
      requiredCapabilities: ['research'],
      strategy: 'parallel',
      title: 'Research',
    },
    {
      dependencies: ['research'],
      description: 'Create product structure, interaction model, and design direction.',
      id: 'design',
      permissions: ['knowledge.read', 'blackboard.read', 'blackboard.write'],
      priority: 90,
      requiredCapabilities: ['writing'],
      strategy: 'iterative',
      title: 'Design',
    },
    {
      dependencies: ['design'],
      description: 'Implement the planned experience or technical artifact.',
      id: 'implementation',
      permissions: ['filesystem.read', 'filesystem.write', 'blackboard.read', 'blackboard.write'],
      priority: 80,
      requiredCapabilities: ['coding'],
      strategy: 'sequential',
      title: 'Implementation',
    },
    {
      dependencies: ['implementation'],
      description: 'Run tests, validate behavior, and identify regressions.',
      id: 'testing',
      permissions: ['command.execute', 'filesystem.read', 'blackboard.read', 'blackboard.write'],
      priority: 70,
      requiredCapabilities: ['testing'],
      strategy: 'self-review',
      title: 'Testing',
    },
    {
      dependencies: ['implementation'],
      description: 'Review implementation for security risks, permissions, and data leakage.',
      id: 'security-review',
      permissions: ['security.review', 'filesystem.read', 'blackboard.read', 'blackboard.write'],
      priority: 75,
      requiredCapabilities: ['security'],
      strategy: 'self-review',
      title: 'Security Review',
    },
    {
      dependencies: ['testing', 'security-review'],
      description: 'Merge outputs, resolve disagreements, and prepare the final answer.',
      id: 'final-review',
      permissions: ['blackboard.read', 'blackboard.write'],
      priority: 60,
      requiredCapabilities: ['review'],
      strategy: 'consensus',
      title: 'Final Review',
    },
  ];
}

function defaultTemplates(): readonly TaskTemplate[] {
  return [
    {
      dependencies: [],
      description: 'Plan the requested objective and produce a reviewed output.',
      id: 'planning',
      permissions: ['blackboard.write', 'knowledge.read'],
      priority: 100,
      requiredCapabilities: ['planning'],
      strategy: 'sequential',
      title: 'Planning',
    },
  ];
}
