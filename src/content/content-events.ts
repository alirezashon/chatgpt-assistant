import type { CommandId } from '@/features/commands';

export const CONTENT_EVENTS = {
  commandTriggered: 'ai-productivity-layer:command-triggered',
  contextChanged: 'ai-productivity-layer:context-changed',
  surfaceRequested: 'ai-productivity-layer:surface-requested',
} as const;

export interface SurfaceRequestedDetail {
  readonly commandId?: CommandId;
  readonly surface: 'command-palette' | 'floating-toolbar' | 'selection-toolbar' | 'sidebar';
}

export function dispatchContentEvent(name: string, detail: unknown): void {
  window.dispatchEvent(
    new CustomEvent(name, {
      detail,
    }),
  );
}
