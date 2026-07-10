import { APP_NAME, APP_VERSION } from '@/constants/app';
import { STORAGE_KEYS } from '@/constants/storage';
import type { StorageDriver, StorageValue } from '@/storage';

export const LOCAL_DIAGNOSTIC_BUNDLE_KIND = 'chatgpt-workspace.local-diagnostics';
export const MAX_LOCAL_ERROR_REPORTS = 20;

export type DiagnosticSurface = 'content-script' | 'options' | 'popup';

export interface LocalErrorReport {
  readonly appVersion: string;
  readonly column?: number;
  readonly id: string;
  readonly line?: number;
  readonly message: string;
  readonly name: string;
  readonly source?: string;
  readonly stack?: string;
  readonly surface: DiagnosticSurface;
  readonly timestamp: string;
  readonly url?: string;
}

export interface LocalDiagnosticBundle {
  readonly appName: string;
  readonly appVersion: string;
  readonly exportedAt: string;
  readonly kind: typeof LOCAL_DIAGNOSTIC_BUNDLE_KIND;
  readonly privacyNote: string;
  readonly reports: readonly LocalErrorReport[];
}

interface LocalErrorReportInput {
  readonly column?: number;
  readonly error?: unknown;
  readonly line?: number;
  readonly message?: string;
  readonly source?: string;
  readonly surface: DiagnosticSurface;
  readonly url?: string;
}

interface InstallLocalErrorReportingOptions {
  readonly storage: StorageDriver;
  readonly surface: DiagnosticSurface;
  readonly windowObject?: Window;
}

export async function appendLocalErrorReport(
  storage: StorageDriver,
  report: LocalErrorReport,
): Promise<void> {
  const reports = await readLocalErrorReports(storage);

  await storage.set(
    STORAGE_KEYS.diagnostics,
    [report, ...reports].slice(0, MAX_LOCAL_ERROR_REPORTS),
  );
}

export async function clearLocalErrorReports(storage: StorageDriver): Promise<void> {
  await storage.remove(STORAGE_KEYS.diagnostics);
}

export function createLocalErrorReport(
  input: LocalErrorReportInput,
  now: () => Date = () => new Date(),
  idFactory: () => string = createDiagnosticId,
): LocalErrorReport {
  const serialized = serializeError(input.error);
  const message = input.message ?? serialized.message;

  const sanitizedUrl = sanitizeUrl(input.url);

  return {
    appVersion: APP_VERSION,
    id: idFactory(),
    message: message.length > 0 ? message : 'Unknown extension error.',
    name: serialized.name,
    surface: input.surface,
    timestamp: now().toISOString(),
    ...(input.column === undefined ? {} : { column: input.column }),
    ...(input.line === undefined ? {} : { line: input.line }),
    ...(input.source === undefined ? {} : { source: input.source }),
    ...(serialized.stack === undefined ? {} : { stack: serialized.stack }),
    ...(sanitizedUrl === undefined ? {} : { url: sanitizedUrl }),
  };
}

export async function createLocalDiagnosticBundle(
  storage: StorageDriver,
  now: () => Date = () => new Date(),
): Promise<LocalDiagnosticBundle> {
  return {
    appName: APP_NAME,
    appVersion: APP_VERSION,
    exportedAt: now().toISOString(),
    kind: LOCAL_DIAGNOSTIC_BUNDLE_KIND,
    privacyNote:
      'This diagnostic bundle is generated locally and is not uploaded automatically. Review it before sharing.',
    reports: await readLocalErrorReports(storage),
  };
}

export function installLocalErrorReporting(options: InstallLocalErrorReportingOptions): () => void {
  const windowObject = options.windowObject;

  if (windowObject === undefined) {
    return () => {
      // No browser window is available on this surface.
    };
  }

  const handleError = (event: ErrorEvent): void => {
    void appendLocalErrorReport(
      options.storage,
      createLocalErrorReport({
        column: event.colno,
        error: event.error,
        line: event.lineno,
        message: event.message,
        source: event.filename,
        surface: options.surface,
        url: windowObject.location.href,
      }),
    ).catch(() => {
      // Diagnostics are best-effort and must never interrupt the extension UI.
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const serialized = serializeError(event.reason);

    void appendLocalErrorReport(
      options.storage,
      createLocalErrorReport({
        error: event.reason,
        message: serialized.message,
        surface: options.surface,
        url: windowObject.location.href,
      }),
    ).catch(() => {
      // Diagnostics are best-effort and must never interrupt the extension UI.
    });
  };

  windowObject.addEventListener('error', handleError);
  windowObject.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    windowObject.removeEventListener('error', handleError);
    windowObject.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}

export async function readLocalErrorReports(storage: StorageDriver): Promise<LocalErrorReport[]> {
  return normalizeLocalErrorReports(await storage.get(STORAGE_KEYS.diagnostics));
}

export function stringifyLocalDiagnosticBundle(bundle: LocalDiagnosticBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

function createDiagnosticId(): string {
  return `diag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLocalErrorReports(value: StorageValue): LocalErrorReport[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isLocalErrorReport).slice(0, MAX_LOCAL_ERROR_REPORTS);
}

function isLocalErrorReport(value: unknown): value is LocalErrorReport {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['appVersion'] === 'string' &&
    typeof value['id'] === 'string' &&
    typeof value['message'] === 'string' &&
    typeof value['name'] === 'string' &&
    isDiagnosticSurface(value['surface']) &&
    typeof value['timestamp'] === 'string'
  );
}

function isDiagnosticSurface(value: unknown): value is DiagnosticSurface {
  return value === 'content-script' || value === 'options' || value === 'popup';
}

function sanitizeUrl(url: string | undefined): string | undefined {
  if (url === undefined || url.length === 0) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(url);

    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch {
    return undefined;
  }
}

function serializeError(error: unknown): Pick<LocalErrorReport, 'message' | 'name' | 'stack'> {
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
    message: 'Unknown extension error.',
    name: 'Error',
  };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
