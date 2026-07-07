import type {
  ActionContext,
  ActionDefinition,
  ActionProvider,
} from '@/features/actions/action-types';

export class ActionRegistry {
  private readonly providers = new Map<string, ActionProvider>();

  public registerProvider(provider: ActionProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getActions(context: ActionContext): readonly ActionDefinition[] {
    return [...this.providers.values()].flatMap((provider) => provider.getActions(context));
  }

  public findAction(actionId: string, context: ActionContext): ActionDefinition | null {
    return this.getActions(context).find((action) => action.id === actionId) ?? null;
  }
}
