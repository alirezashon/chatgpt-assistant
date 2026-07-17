import type { AuthorizationRequest, AuthorizationResult, SecurityAuditEvent } from './security-types';

/** Append-only security audit logger. */
export class SecurityAuditLogger {
  private readonly events: SecurityAuditEvent[] = [];

  /** Records authorization decision. */
  public record(request: AuthorizationRequest, result: AuthorizationResult): SecurityAuditEvent {
    const event: SecurityAuditEvent = {
      action: request.action,
      allowed: result.allowed,
      capability: request.capability,
      decision: result.decision,
      details: {
        approvalId: result.approvalId ?? '',
        policyIds: result.policyIds.join(','),
        requestId: request.context.requestId,
      },
      id: crypto.randomUUID(),
      identityType: request.context.actor.principal.type,
      principalId: request.context.actor.principal.id,
      reason: result.reason,
      resourceId: request.resource.id,
      risk: result.risk.level,
      timestamp: Date.now(),
    };
    this.events.push(event);
    return event;
  }

  /** Lists audit events. */
  public list(): readonly SecurityAuditEvent[] {
    return this.events;
  }
}
