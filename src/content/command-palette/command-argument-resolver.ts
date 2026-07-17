import type { PaletteCommand } from './command-palette-types';

/** Resolves whether command arguments are satisfied. */
export class CommandArgumentResolver {
  /** Returns missing required argument ids. */
  public getMissingArguments(
    command: PaletteCommand,
    values: Readonly<Record<string, unknown>>,
  ): readonly string[] {
    return (command.arguments ?? [])
      .filter((argument) => argument.required && values[argument.id] === undefined)
      .map((argument) => argument.id);
  }
}
