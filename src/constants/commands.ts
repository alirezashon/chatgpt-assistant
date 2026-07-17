import type { CommandId } from '@/features/commands';

export const COMMAND_IDS = {
  inputRewrite: 'input.rewrite',
  pageSummarize: 'page.summarize',
  runtimeOpenPalette: 'runtime.openPalette',
  runtimeOpenSidebar: 'runtime.openSidebar',
  selectionExplain: 'selection.explain',
  selectionRewrite: 'selection.rewrite',
} as const satisfies Readonly<Record<string, CommandId>>;

export const CHROME_COMMANDS = {
  openCommandPalette: 'open-command-palette',
  summarizePage: 'summarize-page',
} as const;
