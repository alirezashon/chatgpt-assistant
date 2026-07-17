export interface NormalizedError {
  readonly message: string;
  readonly name: string;
  readonly stack?: string;
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      ...(error.stack === undefined ? {} : { stack: error.stack }),
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      name: 'Error',
    };
  }

  return {
    message: 'An unknown error occurred.',
    name: 'UnknownError',
  };
}
