import { WorkflowRuntimeError } from './workflow-types';

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:[-+][a-zA-Z0-9.-]+)?$/;

/** Parses a semantic workflow version. */
export function parseWorkflowVersion(version: string): readonly [number, number, number] {
  const match = SEMVER_PATTERN.exec(version);

  if (match === null) {
    throw new WorkflowRuntimeError(
      'WORKFLOW_INVALID_SCHEMA',
      `Invalid workflow version: ${version}`,
    );
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Returns true when actual is greater than or equal to minimum. */
export function workflowVersionSatisfies(actual: string, minimum: string): boolean {
  const actualParts = parseWorkflowVersion(actual);
  const minimumParts = parseWorkflowVersion(minimum);

  for (const index of [0, 1, 2] as const) {
    if (actualParts[index] > minimumParts[index]) {
      return true;
    }

    if (actualParts[index] < minimumParts[index]) {
      return false;
    }
  }

  return true;
}
