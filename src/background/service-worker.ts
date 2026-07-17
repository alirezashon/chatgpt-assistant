import { COMMAND_IDS } from '@/constants';
import { STORAGE_KEYS } from '@/constants/storage';
import type { CommandId } from '@/features/commands';
import {
  configureSidePanel,
  getActiveTab,
  openOptionsPage,
  openSidePanel,
  reportChromeApiError,
  sendTabMessage,
} from '@/lib/chrome/chrome-api';
import { createMessage, installRuntimeMessageHandler } from '@/lib/messaging';
import { ChromeExtensionStorage, DEFAULT_EXTENSION_SETTINGS } from '@/lib/storage';

import { commandIdFromContextMenu, installContextMenus } from './context-menu';
import { commandIdFromChromeCommand } from './keyboard-commands';

const storage = new ChromeExtensionStorage('local');

chrome.runtime.onInstalled.addListener(() => {
  void initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  installContextMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const commandId = commandIdFromContextMenu(info.menuItemId);

  if (commandId === null || tab?.id === undefined) {
    return;
  }

  void dispatchCommandToTab(tab.id, commandId, info.selectionText);
});

chrome.commands.onCommand.addListener((command) => {
  const commandId = commandIdFromChromeCommand(command);

  if (commandId === null) {
    return;
  }

  void dispatchCommandToActiveTab(commandId);
});

installRuntimeMessageHandler(async (message, sender) => {
  switch (message.type) {
    case 'runtime.ping':
      return {
        data: {
          pong: true,
          requestId: message.payload.requestId,
        },
        ok: true,
      };
    case 'runtime.openOptions':
      await openOptionsPage();
      return { data: undefined, ok: true };
    case 'runtime.openSidebar':
      await openSidebarForSender(sender);
      return { data: undefined, ok: true };
    case 'command.run':
      return {
        error: 'Command execution is reserved for the future workflow and AI provider layer.',
        ok: false,
      };
    default:
      return undefined;
  }
});

async function initializeExtension(): Promise<void> {
  installContextMenus();
  await seedDefaultSettings();
  await configureSidePanel({
    enabled: true,
    path: 'sidebar.html',
  });
}

async function seedDefaultSettings(): Promise<void> {
  const existing = await storage.get(STORAGE_KEYS.extensionSettings);

  if (existing === null) {
    await storage.set(STORAGE_KEYS.extensionSettings, DEFAULT_EXTENSION_SETTINGS);
  }
}

async function dispatchCommandToActiveTab(commandId: CommandId): Promise<void> {
  const tab = await getActiveTab();

  if (tab?.id === undefined) {
    return;
  }

  await dispatchCommandToTab(tab.id, commandId);
}

async function dispatchCommandToTab(
  tabId: number,
  commandId: CommandId,
  selectedText?: string,
): Promise<void> {
  try {
    if (commandId === COMMAND_IDS.runtimeOpenSidebar) {
      await configureSidePanel({
        enabled: true,
        path: 'sidebar.html',
        tabId,
      });
      await openSidePanel();
      return;
    }

    await sendTabMessage(
      tabId,
      createMessage('background', 'shortcut.triggered', {
        commandId,
      }),
    );

    if (selectedText !== undefined && selectedText.trim().length > 0) {
      await sendTabMessage(
        tabId,
        createMessage('background', 'selection.changed', {
          context: {
            capturedAt: new Date().toISOString(),
            hostname: '',
            pageKind: 'generic',
            selectedText,
            title: '',
            url: '',
          },
          selectedText,
        }),
      );
    }
  } catch (error) {
    reportChromeApiError(error);
  }
}

async function openSidebarForSender(sender: chrome.runtime.MessageSender): Promise<void> {
  const tabId = sender.tab?.id;

  if (tabId !== undefined) {
    await configureSidePanel({
      enabled: true,
      path: 'sidebar.html',
      tabId,
    });
  }

  await openSidePanel(sender.tab?.windowId);
}
