import type { WorkflowDefinition, WorkflowPermission, WorkflowStep } from './workflow-types';
import { WorkflowRuntimeError } from './workflow-types';

/** Enforces workflow-level permission boundaries. */
export class WorkflowPermissionManager {
  /** Throws when a step requires permissions the workflow did not declare. */
  public assertStepAllowed(definition: WorkflowDefinition, step: WorkflowStep): void {
    for (const permission of this.requiredForStep(step)) {
      if (!definition.permissions.includes(permission)) {
        throw new WorkflowRuntimeError(
          'WORKFLOW_PERMISSION_DENIED',
          `Workflow ${definition.id} lacks permission ${permission}`,
          { permission },
        );
      }
    }

    for (const permission of step.permissions ?? []) {
      this.assertWorkflowPermission(definition, permission);
    }
  }

  private assertWorkflowPermission(
    definition: WorkflowDefinition,
    permission: WorkflowPermission,
  ): void {
    if (!definition.permissions.includes(permission)) {
      throw new WorkflowRuntimeError(
        'WORKFLOW_PERMISSION_DENIED',
        `Workflow ${definition.id} lacks permission ${permission}`,
        { permission },
      );
    }
  }

  private requiredForStep(step: WorkflowStep): readonly WorkflowPermission[] {
    if (step.type === 'ai') {
      return ['ai.request'];
    }

    if (step.type === 'api') {
      return ['api.request'];
    }

    if (step.type === 'browser-action') {
      return ['browser.action'];
    }

    if (step.type === 'command') {
      return ['command.execute'];
    }

    if (step.type === 'human-approval') {
      return ['human.approval'];
    }

    if (step.type === 'plugin') {
      return ['plugin.execute'];
    }

    if (step.type === 'sub-workflow') {
      return ['workflow.start'];
    }

    return [];
  }
}
