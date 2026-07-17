/** Supported logger levels. */
export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

/** Structured log entry. */
export interface LogEntry {
  /** Log level. */
  readonly level: LogLevel;
  /** Message safe for diagnostics. */
  readonly message: string;
  /** Timestamp in milliseconds. */
  readonly timestamp: number;
  /** Optional diagnostic fields. */
  readonly fields?: Readonly<Record<string, unknown>>;
}

/** Production logger contract. */
export interface Logger {
  /** Writes a debug log. */
  debug(message: string, fields?: Readonly<Record<string, unknown>>): void;
  /** Writes an info log. */
  info(message: string, fields?: Readonly<Record<string, unknown>>): void;
  /** Writes a warning log. */
  warn(message: string, fields?: Readonly<Record<string, unknown>>): void;
  /** Writes an error log. */
  error(message: string, fields?: Readonly<Record<string, unknown>>): void;
  /** Returns buffered logs. */
  entries(): readonly LogEntry[];
}

/** In-memory structured logger for runtime diagnostics. */
export class MemoryLogger implements Logger {
  private readonly logs: LogEntry[] = [];

  public debug(message: string, fields?: Readonly<Record<string, unknown>>): void {
    this.write('debug', message, fields);
  }

  public info(message: string, fields?: Readonly<Record<string, unknown>>): void {
    this.write('info', message, fields);
  }

  public warn(message: string, fields?: Readonly<Record<string, unknown>>): void {
    this.write('warn', message, fields);
  }

  public error(message: string, fields?: Readonly<Record<string, unknown>>): void {
    this.write('error', message, fields);
  }

  public entries(): readonly LogEntry[] {
    return [...this.logs];
  }

  private write(
    level: LogLevel,
    message: string,
    fields?: Readonly<Record<string, unknown>>,
  ): void {
    this.logs.push({
      level,
      message,
      timestamp: Date.now(),
      ...(fields === undefined ? {} : { fields }),
    });
  }
}
