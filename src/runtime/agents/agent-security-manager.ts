import type { AgentGoal, AgentToolMetadata } from './agent-types';
import { AgentRuntimeError } from './agent-types';

/** Enforces agent permissions, approval gates, and action limits. */
export class AgentSecurityManager {
  /** Validates that a goal can use a tool. */
  public assertToolAllowed(goal: AgentGoal, tool: AgentToolMetadata): void {
    for (const permission of tool.permissions) {
      if (!goal.permissions.includes(permission)) {
        throw new AgentRuntimeError(
          'AGENT_PERMISSION_DENIED',
          `Agent goal lacks permission ${permission}`,
          { permission },
        );
      }
    }

    if (tool.availability === 'offline' || tool.availability === 'unavailable') {
      throw new AgentRuntimeError('AGENT_TOOL_NOT_FOUND', `Agent tool unavailable: ${tool.name}`);
    }
  }

  /** Returns true when a tool requires human approval. */
  public requiresApproval(tool: AgentToolMetadata): boolean {
    return tool.risk === 'high';
  }

  /** Enforces maximum action count. */
  public assertWithinStepLimit(completedSteps: number, maxSteps: number): void {
    if (completedSteps >= maxSteps) {
      throw new AgentRuntimeError('AGENT_LIMIT_EXCEEDED', 'Agent exceeded maximum step count.');
    }
  }
}
