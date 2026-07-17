import { RuntimeError } from './runtime-error';

/** Throws when a condition is false. Used for public contract checks. */
export function guard(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new RuntimeError('CONTRACT_VIOLATION', message);
  }
}

/** Throws when an internal invariant is false. */
export function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new RuntimeError('INVARIANT_VIOLATION', message);
  }
}
