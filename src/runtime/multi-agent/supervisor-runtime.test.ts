import { describe, expect, it } from 'vitest';

import { createSpecializedAgentDefinition } from './standard-agents';
import { SupervisorRuntime } from './supervisor-runtime';
import type {
  AgentDefinition,
  AgentExecutor,
  AgentTaskResult,
  MultiAgentPlanner,
  MultiAgentTaskGraph,
} from './multi-agent-types';

describe('SupervisorRuntime', () => {
  it('plans, delegates, coordinates, and completes a multi-agent build goal', async () => {
    const runtime = new SupervisorRuntime({ maxParallelAgents: 2 });

    for (const kind of ['research', 'writing', 'coding', 'testing', 'security', 'review'] as const) {
      runtime.registry.register(createSpecializedAgentDefinition({ id: kind, kind }), executor(kind));
    }

    const session = await runtime.start({
      goal: {
        objective: 'Build a complete SaaS landing page.',
        successCriteria: ['Research, design, implementation, testing, security, and final review are complete.'],
      },
    });

    expect(session.status).toBe('completed');
    expect(session.graph.tasks.map((task) => task.status)).toEqual([
      'succeeded',
      'succeeded',
      'succeeded',
      'succeeded',
      'succeeded',
      'succeeded',
    ]);
    expect(session.metrics.completedTasks).toBe(6);
    expect(runtime.blackboard.snapshot(['blackboard.read']).artifacts).toHaveLength(6);
    expect(runtime.communication.list(session.id).length).toBeGreaterThan(0);
    expect(runtime.permissions.audit().every((event) => event.allowed)).toBe(true);
  });

  it('requires human approval for elevated deployment permissions', async () => {
    const runtime = new SupervisorRuntime({ planner: deployPlanner });
    runtime.registry.register(
      createSpecializedAgentDefinition({
        extraPermissions: ['tool.deploy'],
        id: 'automation',
        kind: 'automation',
      }),
      executor('automation'),
    );

    const waiting = await runtime.start({
      goal: {
        objective: 'Deploy the reviewed extension.',
      },
    });

    expect(waiting.status).toBe('waiting-approval');
    expect(waiting.waitingApprovalId).toBeDefined();

    const completed = await runtime.approve({
      approvalId: waiting.waitingApprovalId ?? '',
      decision: 'approved',
    });

    expect(completed.status).toBe('completed');
    expect(completed.outputs['deploy']?.success).toBe(true);
  });

  it('rejects agents without required permissions and preserves the audit trail', async () => {
    const runtime = new SupervisorRuntime({ planner: implementationPlanner });
    runtime.registry.register(
      limitedAgent('limited-coder'),
      executor('limited-coder'),
    );

    const session = await runtime.start({
      goal: {
        objective: 'Implement a feature.',
      },
    });

    expect(session.status).toBe('failed');
    expect(session.graph.tasks[0]?.status).toBe('failed');
    expect(runtime.permissions.audit().some((event) => !event.allowed)).toBe(true);
  });

  it('resolves competitive outputs by quality and confidence', async () => {
    const runtime = new SupervisorRuntime({ planner: competitivePlanner });
    runtime.registry.register(createSpecializedAgentDefinition({ id: 'review-a', kind: 'review' }), {
      execute: () => Promise.resolve(result('review-a', 0.6, 0.6)),
    });
    runtime.registry.register(createSpecializedAgentDefinition({ id: 'review-b', kind: 'review' }), {
      execute: () => Promise.resolve(result('review-b', 0.95, 0.9)),
    });

    const session = await runtime.start({
      goal: {
        objective: 'Choose the best architecture.',
      },
    });

    expect(session.status).toBe('completed');
    expect(session.decisions[0]?.agentId).toBe('review-b');
    expect(session.outputs['debate']?.summary).toContain('review-b');
  });
});

function executor(label: string): AgentExecutor {
  return {
    execute: (context) =>
      Promise.resolve(
        result(`${label}:${context.task.title}`, 0.9, 0.9, {
          taskId: context.task.id,
          visibleArtifacts: context.blackboard.artifacts.length,
        }),
      ),
  };
}

function result(
  summary: string,
  confidence: number,
  quality: number,
  output: AgentTaskResult['output'] = {},
): AgentTaskResult {
  return {
    confidence,
    cost: 1,
    followUps: [],
    issues: [],
    output,
    quality,
    success: true,
    summary,
    tokenUsage: 100,
  };
}

function limitedAgent(id: string): AgentDefinition {
  const definition = createSpecializedAgentDefinition({ id, kind: 'coding' });

  return {
    ...definition,
    profile: {
      ...definition.profile,
      allowedActions: definition.profile.allowedActions.filter((permission) => permission !== 'filesystem.write'),
      capabilities: definition.profile.capabilities.map((capability) =>
        capability.id === 'coding'
          ? {
              ...capability,
              permissions: capability.permissions.filter((permission) => permission !== 'filesystem.write'),
            }
          : capability,
      ),
    },
  };
}

const implementationPlanner: MultiAgentPlanner = {
  plan: () =>
    Promise.resolve({
      id: 'implementation-plan',
      strategy: 'sequential',
      tasks: [
        task({
          id: 'implementation',
          permissions: ['filesystem.write', 'blackboard.write'],
          requiredCapabilities: ['coding'],
          title: 'Implementation',
        }),
      ],
    }),
};

const deployPlanner: MultiAgentPlanner = {
  plan: () =>
    Promise.resolve({
      id: 'deploy-plan',
      strategy: 'sequential',
      tasks: [
        task({
          id: 'deploy',
          permissions: ['tool.deploy', 'blackboard.write'],
          requiredCapabilities: ['automation'],
          title: 'Deploy',
        }),
      ],
    }),
};

const competitivePlanner: MultiAgentPlanner = {
  plan: () =>
    Promise.resolve({
      id: 'competitive-plan',
      strategy: 'competitive',
      tasks: [
        task({
          id: 'debate',
          permissions: ['blackboard.write'],
          requiredCapabilities: ['review'],
          strategy: 'competitive',
          title: 'Architecture Debate',
        }),
      ],
    }),
};

function task(input: {
  readonly id: string;
  readonly permissions: MultiAgentTaskGraph['tasks'][number]['permissions'];
  readonly requiredCapabilities: readonly string[];
  readonly strategy?: MultiAgentTaskGraph['tasks'][number]['strategy'];
  readonly title: string;
}): MultiAgentTaskGraph['tasks'][number] {
  return {
    attempts: 0,
    constraints: [],
    dependencies: [],
    description: input.title,
    id: input.id,
    maxAttempts: 1,
    permissions: input.permissions,
    priority: 100,
    requiredCapabilities: input.requiredCapabilities,
    status: 'pending',
    strategy: input.strategy ?? 'sequential',
    successCriteria: ['Task succeeds.'],
    timeoutMs: 5_000,
    title: input.title,
  };
}
