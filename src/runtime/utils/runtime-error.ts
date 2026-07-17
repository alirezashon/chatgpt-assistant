/** Stable runtime error categories used across the micro-kernel. */
export type RuntimeErrorCode =
  | 'CANCELLED'
  | 'CIRCULAR_DEPENDENCY'
  | 'CONTRACT_VIOLATION'
  | 'DISPOSED'
  | 'INVARIANT_VIOLATION'
  | 'INVALID_STATE'
  | 'NOT_FOUND'
  | 'REGISTRATION_CONFLICT'
  | 'TIMEOUT'
  | 'UNKNOWN';

/** Structured error used by kernel, DI, messaging, and storage subsystems. */
export class RuntimeError extends Error {
  /** Stable machine-readable error code. */
  public readonly code: RuntimeErrorCode;

  /** Optional structured details safe for diagnostics after caller redaction. */
  public readonly details: Readonly<Record<string, unknown>> | undefined;

  public constructor(
    code: RuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
    this.details = details;
  }
}

/** Converts unknown thrown values to a RuntimeError. */
export function toRuntimeError(error: unknown): RuntimeError {
  if (error instanceof RuntimeError) {
    return error;
  }

  if (error instanceof Error) {
    return new RuntimeError('UNKNOWN', error.message, {
      name: error.name,
      stack: error.stack,
    });
  }

  return new RuntimeError('UNKNOWN', 'An unknown runtime error occurred.');
}
