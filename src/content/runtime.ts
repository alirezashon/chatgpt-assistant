import { extractPageContext } from '@/features/context';
import { requestRuntime } from '@/lib/messaging';

import { CommandPaletteRuntime } from './command-palette';
import { FloatingSurfaceRuntime } from './floating-surface';
import { CONTENT_EVENTS, type SurfaceRequestedDetail } from './content-events';
import { installContentMessageHandlers } from './message-handlers';
import { installSelectionObserver } from './selection-observer';
import { installSurfaceHosts } from './surface-hosts';

export function installContentRuntime(): void {
  installSurfaceHosts();
  installContentMessageHandlers();
  installSelectionObserver();
  new FloatingSurfaceRuntime().install();
  const commandPalette = new CommandPaletteRuntime();
  commandPalette.install();
  window.addEventListener(CONTENT_EVENTS.surfaceRequested, (event) => {
    const detail = (event as CustomEvent<SurfaceRequestedDetail>).detail;

    if (detail.surface === 'command-palette') {
      commandPalette.open();
    }
  });

  void requestRuntime('content', 'context.changed', extractPageContext()).catch(() => {
    // The background worker can be asleep or reloading; the next user action will reconnect.
  });
}
