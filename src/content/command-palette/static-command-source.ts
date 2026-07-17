import type { CommandPaletteCommandSource, PaletteCommand } from './command-palette-types';

/** Static command source for tests and future first-party bootstrap commands. */
export class StaticCommandSource implements CommandPaletteCommandSource {
  public constructor(private readonly commands: readonly PaletteCommand[]) {}

  /** Returns configured commands. */
  public getCommands(): readonly PaletteCommand[] {
    return this.commands;
  }
}
