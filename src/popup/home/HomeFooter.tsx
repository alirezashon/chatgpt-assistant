import { Command } from 'lucide-react';

import { COMMAND_IDS } from '@/constants';
import { Button, KeyboardShortcut } from '@/design-system';

import { triggerCommand } from './home-runner';

export function HomeFooter({
  canMessageTab,
  copy,
  tabId,
}: {
  readonly canMessageTab: boolean;
  readonly copy: { readonly palette: string };
  readonly tabId: number | undefined;
}) {
  return (
    <footer className="mt-[var(--ds-space-3)] flex items-center gap-[var(--ds-space-2)]">
      <Button
        className="flex-1"
        disabled={!canMessageTab}
        icon={Command}
        size="sm"
        onClick={() => {
          void triggerCommand(tabId, COMMAND_IDS.runtimeOpenPalette);
        }}
      >
        {copy.palette}
      </Button>
      <KeyboardShortcut>Ctrl Shift K</KeyboardShortcut>
    </footer>
  );
}
