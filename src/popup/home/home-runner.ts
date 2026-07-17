import { COMMAND_IDS } from '@/constants';
import type { CommandId } from '@/features/commands';
import { openSidePanel, sendTabMessage } from '@/lib/chrome/chrome-api';
import { createMessage } from '@/lib/messaging';
import { saveSidebarTask } from '@/sidebar/workspace/sidebar-workspace-storage';
import { createSidebarTask } from '@/sidebar/workspace/sidebar-workspace-types';

import type { HomeAction, HomePageContext } from './home-types';

/** Runs a Home action. */
export async function runHomeAction(input: {
  readonly action: HomeAction;
  readonly context: HomePageContext | null;
  readonly tabId: number | undefined;
  readonly windowId: number | undefined;
}): Promise<void> {
  if (input.action.commandId === COMMAND_IDS.runtimeOpenPalette) {
    await triggerCommand(input.tabId, input.action.commandId);
    return;
  }

  await saveSidebarTask(createSidebarTask({
    action: input.action,
    context: input.context,
  }));
  await openSidePanel(input.windowId);
  window.close();
}

/** Triggers a command in the active tab. */
export async function triggerCommand(tabId: number | undefined, commandId: CommandId): Promise<void> {
  if (tabId === undefined) {
    return;
  }

  await sendTabMessage(
    tabId,
    createMessage('popup', 'shortcut.triggered', {
      commandId,
    }),
  );
  window.close();
}
