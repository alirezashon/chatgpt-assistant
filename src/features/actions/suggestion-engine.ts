import type { ProductAction } from './action-types';
import type { ActionRegistry } from './action-registry';

/** Suggests the next logical user-goal actions after an action. */
export class ActionSuggestionEngine {
  public constructor(private readonly registry: ActionRegistry) {}

  /** Returns follow-up action definitions. */
  public followUpsFor(action: ProductAction): readonly ProductAction[] {
    return action.suggestedFollowUps
      .map((followUp) => this.registry.get(followUp.actionId))
      .filter((candidate): candidate is ProductAction => candidate !== undefined);
  }
}
