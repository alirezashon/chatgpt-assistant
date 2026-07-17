import type { WorkflowDefinition } from './workflow-types';
import { WorkflowRuntimeError } from './workflow-types';
import { WorkflowValidator } from './workflow-validator';

/** Stores registered workflow definitions. */
export class WorkflowRegistry {
  private readonly workflows = new Map<string, WorkflowDefinition>();

  public constructor(private readonly validator = new WorkflowValidator()) {}

  /** Registers or replaces a workflow definition. */
  public register(definition: WorkflowDefinition): void {
    this.validator.validate(definition);
    this.workflows.set(definition.id, definition);
  }

  /** Returns a workflow definition. */
  public get(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  /** Requires a workflow definition. */
  public require(id: string): WorkflowDefinition {
    const definition = this.get(id);

    if (definition === undefined) {
      throw new WorkflowRuntimeError('WORKFLOW_NOT_FOUND', `Workflow not registered: ${id}`);
    }

    return definition;
  }

  /** Lists registered workflow definitions. */
  public list(): readonly WorkflowDefinition[] {
    return [...this.workflows.values()];
  }
}
