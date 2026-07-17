export type AppErrorCode =
  | 'ASSIGNMENT_NOT_FOUND'
  | 'ASSIGNMENT_VALIDATION_ERROR'
  | 'CHROME_API_UNAVAILABLE'
  | 'CONVERSATION_DETECTION_ERROR'
  | 'EXTENSION_CONTEXT_INVALIDATED'
  | 'FOLDER_NOT_FOUND'
  | 'FOLDER_VALIDATION_ERROR'
  | 'LOGGING_ERROR'
  | 'SERVICE_NOT_IMPLEMENTED'
  | 'STATE_ERROR'
  | 'STORAGE_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppErrorOptions {
  readonly cause?: unknown;
  readonly context?: Readonly<Record<string, unknown>>;
}

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public override readonly cause: unknown;
  public readonly context: Readonly<Record<string, unknown>> | undefined;

  public constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = options.cause;
    this.context = options.context;
  }
}
