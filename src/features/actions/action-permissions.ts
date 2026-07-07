import type { ActionContext, ActionDefinition } from '@/features/actions/action-types';

export class ActionPermissions {
  public canExecute(action: ActionDefinition, context: ActionContext): boolean {
    if (action.disabled === true) {
      return false;
    }

    if (action.scope === 'conversation') {
      return context.targetIds.length === 1;
    }

    if (action.scope === 'bulk') {
      return context.targetIds.length > 0;
    }

    return true;
  }
}
