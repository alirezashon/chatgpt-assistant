import { COMMAND_IDS } from '@/constants';
import type { CommandId } from '@/features/commands';
import { extractPageContext } from '@/features/context';
import { installRuntimeMessageHandler, requestRuntime } from '@/lib/messaging';

import {
  CONTENT_EVENTS,
  dispatchContentEvent,
  type SurfaceRequestedDetail,
} from './content-events';

export function installContentMessageHandlers(): () => void {
  return installRuntimeMessageHandler(async (message) => {
    switch (message.type) {
      case 'context.getActive':
        return {
          data: extractPageContext(),
          ok: true,
        };
      case 'shortcut.triggered':
        await handleCommandTrigger(message.payload.commandId);
        return { data: undefined, ok: true };
      default:
        return undefined;
    }
  });
}

async function handleCommandTrigger(commandId: CommandId): Promise<void> {
  dispatchContentEvent(CONTENT_EVENTS.commandTriggered, {
    commandId,
  });

  if (commandId === COMMAND_IDS.runtimeOpenPalette) {
    requestSurface({
      commandId,
      surface: 'command-palette',
    });
    return;
  }

  if (commandId === COMMAND_IDS.runtimeOpenSidebar) {
    await requestRuntime('content', 'runtime.openSidebar', undefined);
    return;
  }

  requestSurface({
    commandId,
    surface: commandId.startsWith('selection.') ? 'selection-toolbar' : 'command-palette',
  });
}

function requestSurface(detail: SurfaceRequestedDetail): void {
  dispatchContentEvent(CONTENT_EVENTS.surfaceRequested, detail);
}
