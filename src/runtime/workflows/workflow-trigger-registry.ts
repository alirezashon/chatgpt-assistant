import type { WorkflowDefinition, WorkflowTriggerEvent } from './workflow-types';

/** Resolves trigger events to matching workflow definitions. */
export class WorkflowTriggerRegistry {
  /** Resolves workflows whose trigger type and name match the event. */
  public resolve(
    workflows: readonly WorkflowDefinition[],
    event: WorkflowTriggerEvent,
  ): readonly WorkflowDefinition[] {
    return workflows.filter(
      (workflow) => workflow.trigger.type === event.type && workflow.trigger.name === event.name,
    );
  }
}
