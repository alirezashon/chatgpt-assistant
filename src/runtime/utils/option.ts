/** Represents an optional value without using nullable primitives in public APIs. */
export type RuntimeOption<Value> =
  | {
      /** Indicates a present value. */
      readonly some: true;
      /** The present value. */
      readonly value: Value;
    }
  | {
      /** Indicates no value is present. */
      readonly some: false;
    };

/** Creates a present optional value. */
export function some<Value>(value: Value): RuntimeOption<Value> {
  return { some: true, value };
}

/** Creates an empty optional value. */
export function none<Value = never>(): RuntimeOption<Value> {
  return { some: false };
}

/** Converts a nullable value into an option. */
export function fromNullable<Value>(value: Value | null | undefined): RuntimeOption<Value> {
  return value === null || value === undefined ? none() : some(value);
}
