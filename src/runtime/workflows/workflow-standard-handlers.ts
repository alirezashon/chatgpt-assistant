import { sleep } from '@/runtime/utils';

import { resolveValue, WorkflowConditionEngine } from './workflow-condition-engine';
import type {
  WorkflowAIGateway,
  WorkflowApiGateway,
  WorkflowBrowserGateway,
  WorkflowCommandGateway,
  WorkflowExecutionContext,
  WorkflowPluginGateway,
  WorkflowStep,
  WorkflowStepHandler,
  WorkflowStepResult,
  WorkflowSubWorkflowGateway,
  WorkflowValue,
} from './workflow-types';
import { WorkflowRuntimeError } from './workflow-types';

/** Gateway dependencies used by standard workflow step handlers. */
export interface WorkflowStandardHandlerDependencies {
  /** Command gateway. */
  readonly command?: WorkflowCommandGateway;
  /** AI gateway. */
  readonly ai?: WorkflowAIGateway;
  /** API gateway. */
  readonly api?: WorkflowApiGateway;
  /** Browser action gateway. */
  readonly browser?: WorkflowBrowserGateway;
  /** Plugin gateway. */
  readonly plugin?: WorkflowPluginGateway;
  /** Sub-workflow gateway. */
  readonly subWorkflow?: WorkflowSubWorkflowGateway;
  /** Nested executor callback for compound steps. */
  readonly executeSteps?: WorkflowNestedStepExecutor;
}

/** Nested step executor used by parallel and loop handlers. */
export type WorkflowNestedStepExecutor = (
  steps: readonly WorkflowStep[],
  context: WorkflowExecutionContext,
) => Promise<WorkflowExecutionContext>;

/** Creates standard handlers for built-in workflow step families. */
export function createStandardWorkflowStepHandlers(
  dependencies: WorkflowStandardHandlerDependencies,
): readonly WorkflowStepHandler[] {
  const conditions = new WorkflowConditionEngine();

  return [
    {
      execute: async (step, context) => {
        if (step.type !== 'command') {
          return wrongHandler(step.type);
        }

        const gateway = requireGateway(dependencies.command, 'command');
        return success(await gateway.execute(step.commandId, step.input ?? null, context));
      },
      type: 'command',
    },
    {
      execute: async (step, context) => {
        if (step.type !== 'ai') {
          return wrongHandler(step.type);
        }

        const gateway = requireGateway(dependencies.ai, 'ai');
        return success(await gateway.complete(step, context));
      },
      type: 'ai',
    },
    {
      execute: (step, context) => {
        if (step.type !== 'condition') {
          return Promise.resolve(wrongHandler(step.type));
        }

        return Promise.resolve(success(conditions.evaluate(step.expression, context)));
      },
      type: 'condition',
    },
    {
      execute: (step, context) => {
        if (step.type !== 'transform') {
          return Promise.resolve(wrongHandler(step.type));
        }

        const output: Record<string, WorkflowValue> = {};

        for (const [key, value] of Object.entries(step.assign)) {
          output[key] =
            typeof value === 'string' && value.startsWith('$')
              ? resolveValue(value, context)
              : value;
        }

        return Promise.resolve(success(output));
      },
      type: 'transform',
    },
    {
      execute: async (step, context) => {
        if (step.type !== 'api') {
          return wrongHandler(step.type);
        }

        const gateway = requireGateway(dependencies.api, 'api');
        return success(await gateway.execute(step.operation, step.input ?? null, context));
      },
      type: 'api',
    },
    {
      execute: async (step, context) => {
        if (step.type !== 'browser-action') {
          return wrongHandler(step.type);
        }

        const gateway = requireGateway(dependencies.browser, 'browser-action');
        return success(await gateway.execute(step.action, step.input ?? null, context));
      },
      type: 'browser-action',
    },
    {
      execute: async (step, context) => {
        if (step.type !== 'plugin') {
          return wrongHandler(step.type);
        }

        const gateway = requireGateway(dependencies.plugin, 'plugin');
        return success(
          await gateway.execute(step.pluginId, step.action, step.input ?? null, context),
        );
      },
      type: 'plugin',
    },
    {
      execute: (step, context) => {
        if (step.type !== 'human-approval') {
          return Promise.resolve(wrongHandler(step.type));
        }

        return Promise.resolve({
          approvalId: `${context.executionId}:${step.id}`,
          status: 'waiting',
        });
      },
      type: 'human-approval',
    },
    {
      execute: async (step) => {
        if (step.type !== 'delay') {
          return wrongHandler(step.type);
        }

        await sleep(step.delayMs);
        return success(null);
      },
      type: 'delay',
    },
    {
      execute: async (step, context) => {
        if (step.type !== 'parallel') {
          return wrongHandler(step.type);
        }

        const executeSteps = requireGateway(dependencies.executeSteps, 'nested executor');
        const results = await Promise.all(
          step.branches.map((branch) => executeSteps(branch, context)),
        );
        return success(results.map((result) => result.outputs));
      },
      type: 'parallel',
    },
    {
      execute: async (step, context) => {
        if (step.type !== 'loop') {
          return wrongHandler(step.type);
        }

        const items = resolveValue(step.itemsPath, context);

        if (!isWorkflowArray(items)) {
          return success([]);
        }

        const executeSteps = requireGateway(dependencies.executeSteps, 'nested executor');
        const outputs: WorkflowValue[] = [];

        for (const item of items.slice(0, step.maxIterations)) {
          const result = await executeSteps(step.steps, {
            ...context,
            item,
          });
          outputs.push(result.outputs);
        }

        return success(outputs);
      },
      type: 'loop',
    },
    {
      execute: async (step, context) => {
        if (step.type !== 'sub-workflow') {
          return wrongHandler(step.type);
        }

        const gateway = requireGateway(dependencies.subWorkflow, 'sub-workflow');
        return success(await gateway.execute(step.workflowId, step.input ?? null, context));
      },
      type: 'sub-workflow',
    },
  ];
}

function success(output: WorkflowValue): WorkflowStepResult {
  return {
    output,
    status: 'succeeded',
  };
}

function wrongHandler(type: string): WorkflowStepResult {
  return {
    error: `Step sent to wrong handler: ${type}`,
    status: 'failed',
  };
}

function requireGateway<Gateway>(gateway: Gateway | undefined, name: string): Gateway {
  if (gateway === undefined) {
    throw new WorkflowRuntimeError(
      'WORKFLOW_STEP_FAILED',
      `Workflow ${name} gateway is not configured.`,
    );
  }

  return gateway;
}

function isWorkflowArray(value: WorkflowValue): value is readonly WorkflowValue[] {
  return Array.isArray(value);
}
