import type { PaletteCommandHistoryEntry } from './command-palette-types';

/** Tracks local command usage for ranking. */
export class CommandHistoryManager {
  private readonly entries = new Map<string, PaletteCommandHistoryEntry>();

  public constructor(entries: readonly PaletteCommandHistoryEntry[] = []) {
    for (const entry of entries) {
      this.entries.set(entry.commandId, entry);
    }
  }

  /** Records an execution result. */
  public record(commandId: string, success: boolean, now = Date.now()): PaletteCommandHistoryEntry {
    const current = this.entries.get(commandId);
    const next = {
      commandId,
      count: (current?.count ?? 0) + 1,
      lastUsedAt: now,
      successes: (current?.successes ?? 0) + (success ? 1 : 0),
    };

    this.entries.set(commandId, next);

    return next;
  }

  /** Returns a history entry by command id. */
  public get(commandId: string): PaletteCommandHistoryEntry | undefined {
    return this.entries.get(commandId);
  }

  /** Returns all history entries. */
  public all(): readonly PaletteCommandHistoryEntry[] {
    return [...this.entries.values()];
  }

  /** Returns most recent command ids. */
  public recentIds(limit = 8): readonly string[] {
    return [...this.entries.values()]
      .sort((left, right) => right.lastUsedAt - left.lastUsedAt)
      .slice(0, limit)
      .map((entry) => entry.commandId);
  }

  /** Replaces all history entries. */
  public replace(entries: readonly PaletteCommandHistoryEntry[]): void {
    this.entries.clear();

    for (const entry of entries) {
      this.entries.set(entry.commandId, entry);
    }
  }
}

/** Returns valid command history entries from persisted data. */
export function parseCommandHistory(value: unknown): readonly PaletteCommandHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is PaletteCommandHistoryEntry => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return false;
    }

    const candidate = entry as Readonly<Record<string, unknown>>;

    return (
      typeof candidate['commandId'] === 'string' &&
      typeof candidate['lastUsedAt'] === 'number' &&
      typeof candidate['count'] === 'number' &&
      typeof candidate['successes'] === 'number'
    );
  });
}
