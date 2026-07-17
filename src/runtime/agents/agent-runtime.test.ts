import { describe, expect, it } from 'vitest';

import { AgentRuntime } from './agent-runtime';
import type { AgentPlanner, AgentSession, AgentTool, AgentToolMetadata } from './agent-types';

const identity = {
  id: 'user-1',
  label: 'User',
  type: 'user' as const,
};

describe('AgentRuntime', () => {
  it('understands a natural-language goal, plans, executes tools, observes, and completes', async () => {
    const runtime = new AgentRuntime();
    runtime.registerTool(createTool('report.generate', 'Generate a weekly engineering report.'));

    const session = await runtime.start({
      goal: {
        objective: 'Prepare a weekly engineering report',
        permissions: ['ai.request', 'memory.read', 'memory.write'],
      },
      identity,
    });

    expect(session.status).toBe('completed');
    expect(Object.keys(session.outputs)).toHaveLength(1);
    expect(session.observations[0]?.success).toBe(true);
    expect(session.timeline.some((event) => event.type === 'agent.completed')).toBe(true);
  });

  it('blocks tools when the goal lacks required permissions', async () => {
    const runtime = new AgentRuntime();
    runtime.registerTool(
      createTool('browser.click', 'Click a semantic browser element.', ['browser.control']),
    );

    await expect(
      runtime.start({
        goal: {
          objective: 'Click the submit button',
          permissions: ['memory.read'],
        },
        identity,
      }),
    ).rejects.toThrow('lacks permission browser.control');
  });

  it('requires approval for high-risk tools and resumes after approval', async () => {
    const runtime = new AgentRuntime();
    runtime.registerTool(createTool('message.send', 'Send a message.', ['api.request'], 'high'));

    const waiting = await runtime.start({
      goal: {
        objective: 'Send the weekly update message',
        permissions: ['api.request', 'memory.write'],
      },
      identity,
    });

    expect(waiting.status).toBe('waiting-approval');
    expect(waiting.waitingApprovalId).toBe(`${waiting.id}:step-1:message.send`);

    const completed = await runtime.approve({
      approvalId: `${waiting.id}:step-1:message.send`,
      decision: 'approved',
    });

    expect(completed.status).toBe('completed');
    expect(completed.outputs['step-1']).toEqual({ tool: 'message.send', ok: true });
  });

  it('recovers by replanning after a failed observation', async () => {
    const runtime = new AgentRuntime({
      planner: new RecoveryPlanner(),
    });
    runtime.registerTool(createTool('first.tool', 'First tool.', ['ai.request'], 'low', false));
    runtime.registerTool(
      createTool('fallback.tool', 'Fallback tool.', ['ai.request'], 'low', true),
    );

    const session = await runtime.start({
      goal: {
        objective: 'Complete with fallback',
        permissions: ['ai.request', 'memory.write'],
      },
      identity,
    });

    expect(session.status).toBe('completed');
    expect(session.failureCount).toBe(1);
    expect(session.outputs['recovery']).toEqual({ tool: 'fallback.tool', ok: true });
  });

  it('supports pause, resume, cancel, goal modification, and session memory', async () => {
    const runtime = new AgentRuntime();
    runtime.registerTool(createTool('report.generate', 'Generate report.'));
    const completed = await runtime.start({
      goal: 'Prepare report',
      identity,
    });

    const paused = await runtime.pause(completed.id);
    expect(paused.status).toBe('paused');

    const resumed = await runtime.resume(paused.id);
    expect(resumed.status).toBe('completed');

    const modified = await runtime.modifyGoal(resumed.id, {
      objective: 'Prepare revised report',
      permissions: ['ai.request', 'memory.write'],
    });
    expect(modified.goal.objective).toBe('Prepare revised report');

    const memories = await runtime.memory.listForSession(modified.id);
    expect(memories.length).toBeGreaterThan(0);

    const cancelled = await runtime.cancel(modified.id);
    expect(cancelled.status).toBe('cancelled');
  });
});

function createTool(
  name: string,
  description: string,
  permissions: AgentToolMetadata['permissions'] = ['ai.request'],
  risk: AgentToolMetadata['risk'] = 'low',
  success = true,
): AgentTool {
  return {
    execute: () =>
      Promise.resolve({
        observation: {
          data: { tool: name },
          id: crypto.randomUUID(),
          source: name,
          success,
          summary: success ? `${name} succeeded` : `${name} failed`,
          timestamp: Date.now(),
        },
        output: { tool: name, ok: success },
      }),
    metadata: {
      availability: 'available',
      cost: 1,
      description,
      latencyMs: 10,
      name,
      permissions,
      risk,
      schema: {
        required: [],
        version: 1,
      },
    },
  };
}

class RecoveryPlanner implements AgentPlanner {
  public plan(): Promise<AgentSession['plan']> {
    return Promise.resolve({
      fallbackStrategy: 'Use fallback tool.',
      goalId: 'goal',
      id: 'plan',
      steps: [
        {
          dependsOn: [],
          id: 'first',
          input: null,
          objective: 'Try first tool',
          parallelizable: false,
          successCriteria: ['succeeds'],
          toolNames: ['first.tool'],
        },
      ],
      strategy: 'Try first tool.',
      version: 1,
    });
  }

  public replan(): Promise<AgentSession['plan']> {
    return Promise.resolve({
      fallbackStrategy: 'Escalate on failure.',
      goalId: 'goal',
      id: 'replan',
      steps: [
        {
          dependsOn: [],
          id: 'recovery',
          input: null,
          objective: 'Use fallback tool',
          parallelizable: false,
          successCriteria: ['succeeds'],
          toolNames: ['fallback.tool'],
        },
      ],
      strategy: 'Recover with fallback.',
      version: 2,
    });
  }
}
