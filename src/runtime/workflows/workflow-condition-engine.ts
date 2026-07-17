import type { WorkflowCondition, WorkflowExecutionContext, WorkflowValue } from './workflow-types';

/** Evaluates deterministic workflow conditions against execution context. */
export class WorkflowConditionEngine {
  /** Returns true when a condition passes. */
  public evaluate(condition: WorkflowCondition, context: WorkflowExecutionContext): boolean {
    const left = resolveValue(condition.left, context);
    const right =
      typeof condition.right === 'string'
        ? resolveValue(condition.right, context)
        : condition.right;

    if (condition.operator === 'exists') {
      return left !== null;
    }

    if (condition.operator === 'contains') {
      return typeof left === 'string' && typeof right === 'string' && left.includes(right);
    }

    if (condition.operator === 'eq') {
      return left === right;
    }

    if (condition.operator === 'neq') {
      return left !== right;
    }

    if (typeof left !== 'number' || typeof right !== 'number') {
      return false;
    }

    if (condition.operator === 'gt') {
      return left > right;
    }

    if (condition.operator === 'gte') {
      return left >= right;
    }

    if (condition.operator === 'lt') {
      return left < right;
    }

    return left <= right;
  }
}

/** Resolves a path such as variables.foo, outputs.step.value, or context.language. */
export function resolveValue(
  pathOrLiteral: string,
  context: WorkflowExecutionContext,
): WorkflowValue {
  if (!pathOrLiteral.startsWith('$')) {
    return pathOrLiteral;
  }

  const path = pathOrLiteral.slice(1).split('.');
  const [root, ...segments] = path;
  const rootValue =
    root === 'variables'
      ? context.variables
      : root === 'outputs'
        ? context.outputs
        : context.context;

  return getPath(rootValue, segments);
}

function getPath(value: unknown, segments: readonly string[]): WorkflowValue {
  let current: unknown = value;

  for (const segment of segments) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      return null;
    }

    current = (current as Readonly<Record<string, unknown>>)[segment];
  }

  return isWorkflowValue(current) ? current : null;
}

function isWorkflowValue(value: unknown): value is WorkflowValue {
  if (value === null || ['boolean', 'number', 'string'].includes(typeof value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isWorkflowValue);
  }

  if (typeof value === 'object') {
    return Object.values(value).every(isWorkflowValue);
  }

  return false;
}
