import { parseWorkflowVersion } from './workflow-version';
import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowVariableSchema,
  WorkflowValue,
} from './workflow-types';
import { WorkflowRuntimeError } from './workflow-types';

const WORKFLOW_ID_PATTERN = /^[a-z][a-z0-9.-]{2,127}$/;

/** Validates workflow schemas before registration and execution. */
export class WorkflowValidator {
  /** Validates a workflow definition. */
  public validate(definition: WorkflowDefinition): void {
    if (!WORKFLOW_ID_PATTERN.test(definition.id)) {
      throw new WorkflowRuntimeError(
        'WORKFLOW_INVALID_SCHEMA',
        `Invalid workflow id: ${definition.id}`,
      );
    }

    parseWorkflowVersion(definition.version);

    if (definition.steps.length === 0) {
      throw new WorkflowRuntimeError(
        'WORKFLOW_INVALID_SCHEMA',
        `Workflow has no steps: ${definition.id}`,
      );
    }

    this.validateUniqueStepIds(definition.steps);

    for (const [name, schema] of Object.entries(definition.variables)) {
      this.validateVariableDefault(name, schema);
    }

    if (definition.retryPolicy.maxAttempts < 1) {
      throw new WorkflowRuntimeError(
        'WORKFLOW_INVALID_SCHEMA',
        'Retry policy must allow at least one attempt.',
      );
    }
  }

  /** Validates input variables against workflow schemas. */
  public validateVariables(
    definition: WorkflowDefinition,
    values: Readonly<Record<string, WorkflowValue>>,
  ): Readonly<Record<string, WorkflowValue>> {
    const merged: Record<string, WorkflowValue> = {};

    for (const [name, schema] of Object.entries(definition.variables)) {
      const value = values[name] ?? schema.defaultValue;

      if (value === undefined) {
        if (schema.required) {
          throw new WorkflowRuntimeError(
            'WORKFLOW_INVALID_SCHEMA',
            `Missing workflow variable: ${name}`,
          );
        }

        continue;
      }

      if (!matchesSchema(value, schema)) {
        throw new WorkflowRuntimeError(
          'WORKFLOW_INVALID_SCHEMA',
          `Invalid workflow variable: ${name}`,
        );
      }

      merged[name] = value;
    }

    return merged;
  }

  private validateUniqueStepIds(steps: readonly WorkflowStep[]): void {
    const seen = new Set<string>();

    const visit = (step: WorkflowStep): void => {
      if (seen.has(step.id)) {
        throw new WorkflowRuntimeError(
          'WORKFLOW_INVALID_SCHEMA',
          `Duplicate workflow step id: ${step.id}`,
        );
      }

      seen.add(step.id);

      if (step.type === 'parallel') {
        for (const branch of step.branches) {
          for (const child of branch) {
            visit(child);
          }
        }
      }

      if (step.type === 'loop') {
        for (const child of step.steps) {
          visit(child);
        }
      }
    };

    for (const step of steps) {
      visit(step);
    }
  }

  private validateVariableDefault(name: string, schema: WorkflowVariableSchema): void {
    if (schema.defaultValue !== undefined && !matchesSchema(schema.defaultValue, schema)) {
      throw new WorkflowRuntimeError(
        'WORKFLOW_INVALID_SCHEMA',
        `Invalid default for variable: ${name}`,
      );
    }
  }
}

function matchesSchema(value: WorkflowValue, schema: WorkflowVariableSchema): boolean {
  if (schema.type === 'object') {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  return typeof value === schema.type;
}
