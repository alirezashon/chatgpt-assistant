export type Result<Value, Failure = Error> =
  | {
      readonly ok: true;
      readonly value: Value;
    }
  | {
      readonly error: Failure;
      readonly ok: false;
    };

export function success<Value>(value: Value): Result<Value> {
  return {
    ok: true,
    value,
  };
}

export function failure<Failure = Error>(error: Failure): Result<never, Failure> {
  return {
    error,
    ok: false,
  };
}
