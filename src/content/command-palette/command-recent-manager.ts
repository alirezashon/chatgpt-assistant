import type { CommandHistoryManager } from './command-history-manager';

/** Recent command manager backed by usage history. */
export class CommandRecentManager {
  public constructor(private readonly history: CommandHistoryManager) {}

  /** Returns recent command ids in newest-first order. */
  public ids(limit = 8): readonly string[] {
    return this.history.recentIds(limit);
  }
}
