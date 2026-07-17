import { CHROME_COMMANDS, COMMAND_IDS } from '@/constants';
import type { CommandId } from '@/features/commands';

export function commandIdFromChromeCommand(command: string): CommandId | null {
  switch (command) {
    case CHROME_COMMANDS.openCommandPalette:
      return COMMAND_IDS.runtimeOpenPalette;
    case CHROME_COMMANDS.summarizePage:
      return COMMAND_IDS.pageSummarize;
    default:
      return null;
  }
}
