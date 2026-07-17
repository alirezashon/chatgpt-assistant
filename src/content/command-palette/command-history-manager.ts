import type { PaletteCommandHistoryEntry } from './command-palette-types';

/** Tracks local command usage for ranking. */
export class CommandHistoryManager {
  private readonly entries = new Map<string, PaletteCommandHistoryEntry>();

  /** Records an execution result. */
  public record(commandId: string, success: boolean, now = Date.now()): void {
    const current = this.entries.get(commandId);

    this.entries.set(commandId, {
      commandId,
      count: (current?.count ?? 0) + 1,
      lastUsedAt: now,
      successes: (current?.successes ?? 0) + (success ? 1 : 0),
    });
  }

  /** Returns a history entry by command id. */
  public get(commandId: string): PaletteCommandHistoryEntry | undefined {
    return this.entries.get(commandId);
  }

  /** Returns all history entries. */
  public all(): readonly PaletteCommandHistoryEntry[] {
    return [...this.entries.values()];
  }
}
