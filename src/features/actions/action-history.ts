import type { ActionConfig } from '@/features/actions/action-config';
import type { ActionDefinition, ActionHistoryEntry } from '@/features/actions/action-types';

export class ActionHistory {
  private readonly config: ActionConfig;
  private readonly entries: ActionHistoryEntry[] = [];

  public constructor(config: ActionConfig) {
    this.config = config;
  }

  public record(
    action: ActionDefinition,
    targetIds: readonly string[],
  ): readonly ActionHistoryEntry[] {
    this.entries.unshift({
      actionId: action.id,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      reversible: action.id === 'rename-conversation',
      targetIds,
    });

    this.entries.splice(this.config.historyLimit);

    return [...this.entries];
  }
}
