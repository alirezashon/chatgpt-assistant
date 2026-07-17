import { describe, expect, it } from 'vitest';

import { MemoryStorageDriver } from '@/runtime/storage';

import { DriverWorkflowStateStore, MemoryWorkflowStateStore } from './workflow-state-store';
import { WorkflowRuntime } from './workflow-runtime';
import { WorkflowValidator } from './workflow-validator';
import type {
  WorkflowCommandGateway,
  WorkflowDefinition,
  WorkflowStepHandler,
} from './workflow-types';

const commandGateway: WorkflowCommandGateway = {
  execute: (commandId, input) =>
    Promise.resolve({
      commandId,
      input,
      ok: true,
    }),
};

describe('WorkflowRuntime', () => {
  it('validates workflow schemas and rejects duplicate nested step ids', () => {
    const validator = new WorkflowValidator();
    const workflow = createWorkflow({
      permissions: [],
      steps: [
        {
          assign: { value: 'a' },
          id: 'same',
          type: 'transform',
        },
        {
          assign: { value: 'b' },
          id: 'same',
          type: 'transform',
        },
      ],
    });

    expect(() => validator.validate(workflow)).toThrow('Duplicate workflow step id');
  });

  it('executes command and transform steps with checkpoints and outputs', async () => {
    const runtime = new WorkflowRuntime({
      command: commandGateway,
      store: new MemoryWorkflowStateStore(),
    });
    const workflow = createWorkflow({
      permissions: ['command.execute'],
      steps: [
        {
          commandId: 'selection.explain',
          id: 'command',
          input: { text: 'hello' },
          type: 'command',
        },
        {
          assign: {
            copied: '$outputs.command.ok',
          },
          id: 'shape',
          type: 'transform',
        },
      ],
    });

    runtime.registerWorkflow(workflow);
    const execution = await runtime.start(workflow.id);

    expect(execution.status).toBe('succeeded');
    expect(execution.outputs['shape']).toEqual({ copied: true });
    expect(execution.timeline.some((event) => event.type === 'workflow.completed')).toBe(true);
  });

  it('pauses for human approval and resumes after approval', async () => {
    const runtime = new WorkflowRuntime();
    const workflow = createWorkflow({
      permissions: ['human.approval'],
      steps: [
        {
          id: 'approval',
          prompt: 'Send this email?',
          risk: 'high',
          type: 'human-approval',
        },
        {
          assign: {
            status: 'continued',
          },
          id: 'after',
          type: 'transform',
        },
      ],
    });

    runtime.registerWorkflow(workflow);
    const waiting = await runtime.start(workflow.id);

    expect(waiting.status).toBe('waiting-approval');
    expect(waiting.waitingApprovalId).toBe(`${waiting.id}:approval`);

    const completed = await runtime.approve({
      approvalId: `${waiting.id}:approval`,
      decision: 'approved',
    });

    expect(completed.status).toBe('succeeded');
    expect(completed.outputs['after']).toEqual({ status: 'continued' });
  });

  it('recovers waiting executions from a persistent storage-backed state store', async () => {
    const driver = new MemoryStorageDriver();
    const store = new DriverWorkflowStateStore(driver);
    const firstRuntime = new WorkflowRuntime({ store });
    const workflow = createWorkflow({
      permissions: ['human.approval'],
      steps: [
        {
          id: 'approval',
          prompt: 'Approve deploy?',
          risk: 'medium',
          type: 'human-approval',
        },
      ],
    });

    firstRuntime.registerWorkflow(workflow);
    const waiting = await firstRuntime.start(workflow.id);

    const secondRuntime = new WorkflowRuntime({
      store: new DriverWorkflowStateStore(driver),
    });
    secondRuntime.registerWorkflow(workflow);

    const recovered = await secondRuntime.recover();

    expect(recovered).toHaveLength(1);
    expect(recovered[0]?.id).toBe(waiting.id);
    expect(recovered[0]?.status).toBe('waiting-approval');
  });

  it('fails safely when a step uses an undeclared permission', async () => {
    const runtime = new WorkflowRuntime({ command: commandGateway });
    const workflow = createWorkflow({
      permissions: [],
      steps: [
        {
          commandId: 'page.summarize',
          id: 'command',
          type: 'command',
        },
      ],
    });

    runtime.registerWorkflow(workflow);

    await expect(runtime.start(workflow.id)).rejects.toThrow('lacks permission command.execute');
  });

  it('runs plugin-contributed custom step handlers', async () => {
    const runtime = new WorkflowRuntime();
    const customHandler: WorkflowStepHandler = {
      execute: () =>
        Promise.resolve({
          output: { custom: true },
          status: 'succeeded',
        }),
      type: 'api',
    };
    const workflow = createWorkflow({
      permissions: ['api.request'],
      steps: [
        {
          id: 'custom',
          operation: 'plugin.custom',
          type: 'api',
        },
      ],
    });

    runtime.registerStepHandler(customHandler);
    runtime.registerWorkflow(workflow);
    const execution = await runtime.start(workflow.id);

    expect(execution.outputs['custom']).toEqual({ custom: true });
  });

  it('supports trigger resolution, AI steps, pause, cancel, and retry controls', async () => {
    const runtime = new WorkflowRuntime({
      ai: {
        complete: () => Promise.resolve({ confidence: 0.97, summary: 'done' }),
      },
    });
    const workflow = createWorkflow({
      permissions: ['ai.request'],
      steps: [
        {
          id: 'ai',
          intent: 'summarize',
          promptTemplateId: 'summary',
          taskType: 'summarization',
          type: 'ai',
          variables: {},
        },
      ],
    });

    runtime.registerWorkflow(workflow);
    const [execution] = await runtime.trigger({
      name: 'manual',
      payload: null,
      type: 'manual',
    });

    expect(execution?.outputs['ai']).toEqual({ confidence: 0.97, summary: 'done' });

    const paused = await runtime.pause(execution?.id ?? '');
    expect(paused.status).toBe('paused');

    const retried = await runtime.retryExecution(paused.id);
    expect(retried.status).toBe('succeeded');

    const cancelled = await runtime.cancel(retried.id);
    expect(cancelled.status).toBe('cancelled');
  });
});

function createWorkflow(input: {
  readonly permissions: WorkflowDefinition['permissions'];
  readonly steps: WorkflowDefinition['steps'];
  readonly variables?: WorkflowDefinition['variables'];
}): WorkflowDefinition {
  return {
    errorStrategy: 'fail',
    history: true,
    id: 'com.acme.workflow',
    metadata: {},
    name: 'Acme Workflow',
    owner: {
      id: 'user',
      type: 'user',
    },
    permissions: input.permissions,
    retryPolicy: {
      initialDelayMs: 1,
      maxAttempts: 1,
      multiplier: 1,
    },
    steps: input.steps,
    timeoutMs: 10_000,
    trigger: {
      name: 'manual',
      type: 'manual',
    },
    variables: input.variables ?? {},
    version: '1.0.0',
    visibility: 'private',
  };
}
