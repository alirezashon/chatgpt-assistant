import { DEFAULT_SETTINGS } from '@/constants/settings';
import { AppError } from '@/shared/errors';

export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

export interface LogEntry {
  readonly context?: Readonly<Record<string, unknown>> | undefined;
  readonly error?: unknown;
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
}

export interface Logger {
  debug(message: string, context?: Readonly<Record<string, unknown>>): void;
  error(message: string, error?: unknown, context?: Readonly<Record<string, unknown>>): void;
  info(message: string, context?: Readonly<Record<string, unknown>>): void;
  warn(message: string, context?: Readonly<Record<string, unknown>>): void;
}

const LOG_LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

interface ConsoleLoggerOptions {
  readonly minimumLevel?: LogLevel;
}

export class ConsoleLogger implements Logger {
  private readonly minimumLevel: LogLevel;

  public constructor(options: ConsoleLoggerOptions = {}) {
    this.minimumLevel = options.minimumLevel ?? 'info';
  }

  public debug(message: string, context?: Readonly<Record<string, unknown>>): void {
    if (!DEFAULT_SETTINGS.enableDebugLogging) {
      return;
    }

    this.write({
      context,
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
    });
  }

  public error(
    message: string,
    error?: unknown,
    context?: Readonly<Record<string, unknown>>,
  ): void {
    this.write({
      context,
      error,
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
    });
  }

  public info(message: string, context?: Readonly<Record<string, unknown>>): void {
    this.write({
      context,
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
    });
  }

  public warn(message: string, context?: Readonly<Record<string, unknown>>): void {
    this.write({
      context,
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
    });
  }

  private shouldWrite(level: LogLevel): boolean {
    return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[this.minimumLevel];
  }

  private write(entry: LogEntry): void {
    if (!this.shouldWrite(entry.level)) {
      return;
    }

    try {
      const payload = entry.context === undefined ? entry.message : [entry.message, entry.context];

      if (entry.level === 'error') {
        console.error(payload, entry.error);
        return;
      }

      if (entry.level === 'warn') {
        console.warn(payload);
        return;
      }

      if (entry.level === 'debug') {
        console.debug(payload);
        return;
      }

      console.info(payload);
    } catch (cause) {
      throw new AppError('LOGGING_ERROR', 'Failed to write log entry.', { cause });
    }
  }
}

export const logger: Logger = new ConsoleLogger();
