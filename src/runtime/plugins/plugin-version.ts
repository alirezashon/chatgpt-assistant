import { PluginRuntimeError } from './plugin-types';

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:[-+][a-zA-Z0-9.-]+)?$/;

/** Parses a semantic version into numeric parts. */
export function parsePluginVersion(version: string): readonly [number, number, number] {
  const match = SEMVER_PATTERN.exec(version);

  if (match === null) {
    throw new PluginRuntimeError('PLUGIN_INVALID_MANIFEST', `Invalid semantic version: ${version}`);
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Returns true when actual version is greater than or equal to minimum. */
export function satisfiesMinimumVersion(actual: string, minimum: string): boolean {
  const actualParts = parsePluginVersion(actual);
  const minimumParts = parsePluginVersion(minimum);

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
