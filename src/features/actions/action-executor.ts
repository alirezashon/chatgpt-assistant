import type { ActionEvents } from '@/features/actions/action-events';
import type { ActionHistory } from '@/features/actions/action-history';
import { ActionPermissions } from '@/features/actions/action-permissions';
import type {
  ActionContext,
  ActionDefinition,
  ActionExecutionOutcome,
} from '@/features/actions/action-types';

export class ActionExecutor {
  private readonly events: ActionEvents;
  private readonly history: ActionHistory;
  private readonly permissions: ActionPermissions;

  public constructor(
    events: ActionEvents,
    history: ActionHistory,
    permissions: ActionPermissions = new ActionPermissions(),
  ) {
    this.events = events;
    this.history = history;
    this.permissions = permissions;
  }

  public async execute(
    action: ActionDefinition,
    context: ActionContext,
  ): Promise<{
    readonly history: readonly ReturnType<ActionHistory['record']>[number][];
    readonly outcome: ActionExecutionOutcome;
  }> {
    if (!this.permissions.canExecute(action, context)) {
      throw new Error('Action is not available for the current selection.');
    }

    this.events.emit('actionStarted', {
      action,
    });

    try {
      const outcome = await action.execute(context);
      const history = this.history.record(action, context.targetIds);

      this.events.emit('actionCompleted', {
        action,
        outcome,
      });

      return {
        history,
        outcome,
      };
    } catch (error) {
      const actionError = error instanceof Error ? error : new Error('Action failed.');

      this.events.emit('actionFailed', {
        action,
        error: actionError,
      });
      throw actionError;
    }
  }
}
