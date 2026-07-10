import {
  installLocalErrorReporting,
  type DiagnosticSurface,
} from '@/features/diagnostics/local-error-reporting';
import { ChromeStorageDriver } from '@/storage';

export function installExtensionDiagnostics(
  surface: DiagnosticSurface,
  windowObject: Window | undefined = typeof window === 'undefined' ? undefined : window,
): () => void {
  if (windowObject === undefined) {
    return () => {
      // This surface has no window-level error events.
    };
  }

  try {
    return installLocalErrorReporting({
      storage: new ChromeStorageDriver(),
      surface,
      windowObject,
    });
  } catch {
    return () => {
      // Diagnostics are unavailable outside the installed extension.
    };
  }
}
