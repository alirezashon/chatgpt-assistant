import { RuntimeError } from '@/runtime/utils';

/** AI-specific stable error codes. */
export type AIErrorCode =
  | 'AI_BUDGET_EXCEEDED'
  | 'AI_CONTEXT_TOO_LARGE'
  | 'AI_MODEL_NOT_FOUND'
  | 'AI_NO_PROVIDER'
  | 'AI_PRIVACY_VIOLATION'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_RATE_LIMITED'
  | 'AI_SECURITY_BLOCKED'
  | 'AI_STREAM_INTERRUPTED';

/** Structured AI runtime error. */
export class AIError extends RuntimeError {
  /** AI-specific code. */
  public readonly aiCode: AIErrorCode;

  public constructor(code: AIErrorCode, message: string) {
    super('CONTRACT_VIOLATION', message, { aiCode: code });
    this.name = 'AIError';
    this.aiCode = code;
  }
}

/** Normalizes thrown values into AI-safe errors. */
export class AIErrorManager {
  /** Converts unknown errors to Error. */
  public normalize(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error('AI runtime failed.');
  }
}
