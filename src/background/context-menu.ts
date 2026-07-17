import { COMMAND_IDS, CONTEXT_MENU_IDS } from '@/constants';
import type { CommandId } from '@/features/commands';
import { createContextMenu } from '@/lib/chrome/chrome-api';

export function installContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    createContextMenu({
      contexts: ['page'],
      id: CONTEXT_MENU_IDS.openCommandPalette,
      title: 'Open AI Command Palette',
    });

    createContextMenu({
      contexts: ['page'],
      id: CONTEXT_MENU_IDS.summarizePage,
      title: 'Summarize this page',
    });

    createContextMenu({
      contexts: ['selection'],
      id: CONTEXT_MENU_IDS.explainSelection,
      title: 'Explain selection',
    });

    createContextMenu({
      contexts: ['selection', 'editable'],
      id: CONTEXT_MENU_IDS.rewriteSelection,
      title: 'Rewrite selection',
    });
  });
}

export function commandIdFromContextMenu(menuItemId: string | number): CommandId | null {
  switch (menuItemId) {
    case CONTEXT_MENU_IDS.explainSelection:
      return COMMAND_IDS.selectionExplain;
    case CONTEXT_MENU_IDS.openCommandPalette:
      return COMMAND_IDS.runtimeOpenPalette;
    case CONTEXT_MENU_IDS.rewriteSelection:
      return COMMAND_IDS.selectionRewrite;
    case CONTEXT_MENU_IDS.summarizePage:
      return COMMAND_IDS.pageSummarize;
    default:
      return null;
  }
}
