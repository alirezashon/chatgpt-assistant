import type { PageContextSnapshot } from '@/features/context';

import type { PaletteCommand } from './command-palette-types';

/** Registry for first-party and future plugin commands. */
export class CommandRegistry {
  private readonly commands = new Map<string, PaletteCommand>();

  public constructor(commands: readonly PaletteCommand[] = []) {
    for (const command of commands) {
      this.register(command);
    }
  }

  /** Registers or replaces a command definition. */
  public register(command: PaletteCommand): void {
    this.commands.set(command.id, command);
  }

  /** Lists commands available for the current context. */
  public listAvailable(context: PageContextSnapshot | null): readonly PaletteCommand[] {
    return [...this.commands.values()].filter((command) => isAvailable(command, context));
  }
}

function isAvailable(command: PaletteCommand, context: PageContextSnapshot | null): boolean {
  const requirement = command.requiredContext;

  if (requirement === undefined) {
    return true;
  }

  if (requirement.requiresSelection === true && context?.selectedText === undefined) {
    return false;
  }

  if (
    requirement.requiresEditableTarget === true &&
    context?.focusedElement?.isEditable !== true
  ) {
    return false;
  }

  if (
    requirement.pageKinds !== undefined &&
    (context === null || !requirement.pageKinds.includes(context.pageKind))
  ) {
    return false;
  }

  if (
    requirement.hostIncludes !== undefined &&
    (context === null ||
      !requirement.hostIncludes.some((fragment) => context.hostname.includes(fragment)))
  ) {
    return false;
  }

  return true;
}
