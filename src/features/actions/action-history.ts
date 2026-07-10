import type { ActionConfig } from '@/features/actions/action-config';
import type {
  ActionContext,
  ActionDefinition,
  ActionHistoryEntry,
  ActionRecoverySnapshot,
} from '@/features/actions/action-types';

export class ActionHistory {
  private readonly config: ActionConfig;
  private readonly entries: ActionHistoryEntry[] = [];

  public constructor(config: ActionConfig) {
    this.config = config;
  }

  public record(action: ActionDefinition, context: ActionContext): readonly ActionHistoryEntry[] {
    const createdAt = new Date().toISOString();
    const recovery = createActionRecoverySnapshot(action, context, createdAt);
    const targetIds = context.targetIds;

    this.entries.unshift({
      actionId: action.id,
      createdAt,
      id: crypto.randomUUID(),
      ...(recovery === undefined ? {} : { recovery }),
      reversible: action.id === 'rename-conversation' || action.kind === 'danger',
      targetIds,
    });

    this.entries.splice(this.config.historyLimit);

    return [...this.entries];
  }
}

function createActionRecoverySnapshot(
  action: ActionDefinition,
  context: ActionContext,
  capturedAt: string,
): ActionRecoverySnapshot | undefined {
  if (action.kind !== 'danger' && action.danger !== true) {
    return undefined;
  }

  const targetIds = new Set(context.targetIds);

  return {
    actionId: action.id,
    assignments: context.workspace.assignments.assignments.filter((assignment) =>
      targetIds.has(assignment.conversationId),
    ),
    capturedAt,
    conversations: context.workspace.conversations.conversations.filter((conversation) =>
      targetIds.has(conversation.id),
    ),
    folders: context.workspace.folders.folders.filter((folder) =>
      context.workspace.assignments.assignments.some(
        (assignment) =>
          targetIds.has(assignment.conversationId) && assignment.folderId === folder.id,
      ),
    ),
    targetIds: context.targetIds,
  };
}
