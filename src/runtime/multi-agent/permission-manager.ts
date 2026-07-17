import type {
  AgentDefinition,
  MultiAgentAuditEvent,
  MultiAgentPermission,
  MultiAgentTask,
  MultiAgentValue,
} from './multi-agent-types';
import { MultiAgentRuntimeError } from './multi-agent-types';

const APPROVAL_PERMISSIONS: readonly MultiAgentPermission[] = ['browser.write', 'tool.deploy'];

/** Enforces scoped agent permissions and records an audit trail. */
export class MultiAgentPermissionManager {
  private readonly auditEvents: MultiAgentAuditEvent[] = [];

  /** Asserts that an agent may execute a task. */
  public assertTaskAllowed(agent: AgentDefinition, task: MultiAgentTask): void {
    const allowed = new Set([
      ...agent.profile.allowedActions,
      ...agent.profile.memoryAccess,
      ...agent.profile.knowledgeAccess,
      ...agent.profile.capabilities.flatMap((capability) => capability.permissions),
    ]);
    const missing = task.permissions.filter((permission) => !allowed.has(permission));

    if (missing.length > 0) {
      this.record({
        action: 'task.execute',
        agentId: agent.id,
        allowed: false,
        details: {
          missing: missing.join(','),
          taskId: task.id,
        },
        reason: `Missing permissions: ${missing.join(', ')}`,
      });
      throw new MultiAgentRuntimeError(
        'MULTI_AGENT_PERMISSION_DENIED',
        `Agent ${agent.id} lacks task permissions.`,
        {
          agentId: agent.id,
          missing: missing.join(','),
          taskId: task.id,
        },
      );
    }

    this.record({
      action: 'task.execute',
      agentId: agent.id,
      allowed: true,
      details: { taskId: task.id },
      reason: 'All task permissions are available.',
    });
  }

  /** Returns whether a task requires human approval. */
  public requiresApproval(task: MultiAgentTask): boolean {
    return task.permissions.some((permission) => APPROVAL_PERMISSIONS.includes(permission));
  }

  /** Returns audit events. */
  public audit(): readonly MultiAgentAuditEvent[] {
    return this.auditEvents;
  }

  private record(input: {
    readonly action: string;
    readonly agentId: string;
    readonly allowed: boolean;
    readonly details: Readonly<Record<string, MultiAgentValue>>;
    readonly reason: string;
  }): void {
    this.auditEvents.push({
      action: input.action,
      agentId: input.agentId,
      allowed: input.allowed,
      details: input.details,
      id: crypto.randomUUID(),
      reason: input.reason,
      timestamp: Date.now(),
    });
  }
}
