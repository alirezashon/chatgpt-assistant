import type { ActionContext, ActionDefinition, ActionProvider, ProductAction } from './action-types';

/** Registry for legacy workspace menu actions and product-goal actions. */
export class ActionRegistry {
  private readonly providers: ActionProvider[] = [];
  private readonly actions = new Map<string, ProductAction>();

  public constructor(actions: readonly ProductAction[] = []) {
    for (const action of actions) {
      this.register(action);
    }
  }

  /** Registers or replaces an action definition. */
  public register(action: ProductAction): void {
    this.actions.set(action.id, action);
  }

  /** Returns one action by id. */
  public get(actionId: string): ProductAction | undefined {
    return this.actions.get(actionId);
  }

  /** Returns all actions. */
  public all(): readonly ProductAction[] {
    return [...this.actions.values()];
  }

  /** Registers a legacy workspace action provider. */
  public registerProvider(provider: ActionProvider): void {
    this.providers.push(provider);
  }

  /** Returns available legacy workspace actions for a context. */
  public getActions(context: ActionContext): readonly ActionDefinition[] {
    return this.providers.flatMap((provider) => provider.getActions(context));
  }

  /** Finds a legacy workspace action by id for a context. */
  public findAction(actionId: string, context: ActionContext): ActionDefinition | null {
    return this.getActions(context).find((action) => action.id === actionId) ?? null;
  }
}
