import { COMMAND_IDS } from '@/constants';
import type { CommandId } from '@/features/commands';
import { configureSidePanel, openSidePanel, sendTabMessage } from '@/lib/chrome/chrome-api';
import { createMessage } from '@/lib/messaging';
import { saveSidebarTask } from '@/sidebar/workspace/sidebar-workspace-storage';
import { createSidebarTask } from '@/sidebar/workspace/sidebar-workspace-types';

import { ensureActionPermissions } from './action-permissions';
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

  const permissions = await ensureActionPermissions(input.tabId);
  const task = createSidebarTask({
    action: input.action,
    context: input.context,
  });

  if (!permissions.granted) {
    await saveSidebarTask({
      ...task,
      messages: [
        ...task.messages,
        {
          id: `message-${crypto.randomUUID()}`,
          kind: 'completed',
          label: 'Permission needed',
          text: permissions.reason ?? 'Required page permission was not granted.',
          timestamp: new Date().toISOString(),
        },
      ],
      results: [
        {
          content: [
            permissions.reason ?? 'Required page permission was not granted.',
            'Open the action again and approve the browser permission prompt.',
          ],
          format: 'checklist',
          id: `result-${crypto.randomUUID()}`,
          title: 'Action could not start',
        },
      ],
      status: 'failed',
      updatedAt: new Date().toISOString(),
    });
  } else {
    await saveSidebarTask(task);
  }

  if (input.tabId !== undefined) {
    await configureSidePanel({
      enabled: true,
      path: 'sidebar.html',
      tabId: input.tabId,
    });
  }

  await openSidePanel(input.windowId);
  window.close();
}

/** Triggers a command in the active tab. */
export async function triggerCommand(
  tabId: number | undefined,
  commandId: CommandId,
): Promise<void> {
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
