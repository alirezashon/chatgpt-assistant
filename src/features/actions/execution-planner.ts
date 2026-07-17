import type { ActionExecutionStep, ProductAction } from './action-types';

/** Produces execution plans for product actions. */
export class ActionExecutionPlanner {
  /** Returns the declarative plan for an action. */
  public plan(action: ProductAction): readonly ActionExecutionStep[] {
    return action.executionPlan;
  }
}
