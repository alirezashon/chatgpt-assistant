import { Command, PanelRight, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

import { APP_NAME, APP_VERSION, COMMAND_IDS } from '@/constants';
import { useActiveTab } from '@/hooks';
import {
  getExtensionUrl,
  openOptionsPage,
  openSidePanel,
  sendTabMessage,
} from '@/lib/chrome/chrome-api';
import { createMessage } from '@/lib/messaging';

export function PopupApp() {
  const activeTab = useActiveTab();
  const canMessageTab = activeTab?.id !== undefined && activeTab.url?.startsWith('http');

  return (
    <main className="w-[360px] bg-zinc-950 p-4 text-zinc-50">
      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.16 }}
      >
        <img alt="" className="h-10 w-10 rounded-md" src={getExtensionUrl('icons/icon-128.png')} />
        <div>
          <h1 className="text-sm font-semibold tracking-normal">{APP_NAME}</h1>
          <p className="text-xs text-zinc-400">v{APP_VERSION} foundation</p>
        </div>
      </motion.header>

      <section className="mt-4 grid gap-2">
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canMessageTab}
          type="button"
          onClick={() => {
            void openCommandPalette(activeTab?.id);
          }}
        >
          <Command className="h-4 w-4" />
          Command Palette
        </button>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-700 px-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-900"
          type="button"
          onClick={() => {
            void openSidePanel(activeTab?.windowId);
            window.close();
          }}
        >
          <PanelRight className="h-4 w-4" />
          Sidebar
        </button>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-800 px-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
          type="button"
          onClick={() => {
            void openOptionsPage();
            window.close();
          }}
        >
          <Settings className="h-4 w-4" />
          Options
        </button>
      </section>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        {activeTab?.url ?? 'Open a web page to use contextual actions.'}
      </p>
    </main>
  );
}

async function openCommandPalette(tabId: number | undefined): Promise<void> {
  if (tabId === undefined) {
    return;
  }

  await sendTabMessage(
    tabId,
    createMessage('popup', 'shortcut.triggered', {
      commandId: COMMAND_IDS.runtimeOpenPalette,
    }),
  );
  window.close();
}
