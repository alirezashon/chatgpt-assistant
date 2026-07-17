/** Represents a successful or failed operation without throwing. */
export type RuntimeResult<Value, Failure = Error> =
  | {
      /** The operation succeeded. */
      readonly ok: true;
      /** The successful value. */
      readonly value: Value;
    }
  | {
      /** The operation failed. */
      readonly ok: false;
      /** The failure value. */
      readonly error: Failure;
    };

/** Creates a successful result. */
export function ok<Value>(value: Value): RuntimeResult<Value, never> {
  return { ok: true, value };
}

/** Creates a failed result. */
export function err<Failure>(error: Failure): RuntimeResult<never, Failure> {
  return { error, ok: false };
}

/** Returns the wrapped value or throws the wrapped error. */
export function unwrap<Value, Failure>(result: RuntimeResult<Value, Failure>): Value {
  if (result.ok) {
    return result.value;
  }

  throw result.error instanceof Error ? result.error : new Error(String(result.error));
}
