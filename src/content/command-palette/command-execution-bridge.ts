import { requestRuntime } from '@/lib/messaging';
import {
  createSidebarTaskFromAction,
  pageContextToSidebarContext,
  createSidebarTaskFromProductAction,
} from '@/sidebar/workspace/sidebar-workspace-types';
import { saveSidebarTask } from '@/sidebar/workspace/sidebar-workspace-storage';
import { FIRST_PARTY_ACTION_REGISTRY } from '@/features/actions';

import type { CommandPaletteExecutionBridge, PaletteCommand } from './command-palette-types';

/** Safe no-op bridge used until Command Bus integration is connected. */
export class NoopCommandExecutionBridge implements CommandPaletteExecutionBridge {
  /** Records execution boundary without performing side effects. */
  public execute(): void {
    return undefined;
  }
}

/** In-memory bridge for tests and local command providers. */
export class FunctionCommandExecutionBridge implements CommandPaletteExecutionBridge {
  public constructor(
    private readonly handlers: Readonly<
      Record<string, (command: PaletteCommand) => Promise<void> | void>
    >,
  ) {}

  /** Executes a command through a registered function handler. */
  public async execute(
    input: Parameters<CommandPaletteExecutionBridge['execute']>[0],
  ): Promise<void> {
    await this.handlers[input.command.id]?.(input.command);
  }
}

/** Executes palette commands through extension services and the sidebar workspace. */
export class CommandExecutionManager implements CommandPaletteExecutionBridge {
  /** Executes a command immediately from the palette. */
  public async execute(
    input: Parameters<CommandPaletteExecutionBridge['execute']>[0],
  ): Promise<void> {
    if (input.command.id === 'runtime.openPalette') {
      return;
    }

    if (input.command.id === 'system.shortcuts.configure') {
      await requestRuntime('content', 'runtime.openShortcutSettings', undefined);
      return;
    }

    const action = FIRST_PARTY_ACTION_REGISTRY.get(input.command.id);
    const task =
      action === undefined
        ? createSidebarTaskFromAction({
            action: {
              description: input.command.description,
              iconName: input.command.icon,
              id: input.command.id,
              title: input.command.title,
            },
            context: pageContextToSidebarContext(input.context),
          })
        : createSidebarTaskFromProductAction({
            action,
            context: input.context,
          });

    await saveSidebarTask(task);
    await requestRuntime('content', 'runtime.openSidebar', undefined);
  }
}
