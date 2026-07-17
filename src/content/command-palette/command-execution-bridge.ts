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
