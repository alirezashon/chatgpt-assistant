import type { EnterpriseAuditEvent, EnterpriseValue } from './enterprise-types';

/** Organization-scoped append-only audit log with search/export support. */
export class EnterpriseAuditLog {
  private readonly events: EnterpriseAuditEvent[] = [];

  /** Records an audit event. */
  public record(input: {
    readonly action: string;
    readonly actorId: string;
    readonly decision: EnterpriseAuditEvent['decision'];
    readonly details?: Readonly<Record<string, EnterpriseValue>>;
    readonly organizationId: string;
    readonly reason: string;
    readonly targetId: string;
    readonly targetType: string;
  }): EnterpriseAuditEvent {
    const event: EnterpriseAuditEvent = {
      action: input.action,
      actorId: input.actorId,
      decision: input.decision,
      details: input.details ?? {},
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      reason: input.reason,
      targetId: input.targetId,
      targetType: input.targetType,
      timestamp: Date.now(),
    };
    this.events.push(event);
    return event;
  }

  /** Searches audit events. */
  public search(input: {
    readonly action?: string;
    readonly actorId?: string;
    readonly organizationId: string;
    readonly text?: string;
  }): readonly EnterpriseAuditEvent[] {
    const text = input.text?.toLowerCase();
    return this.events
      .filter((event) => event.organizationId === input.organizationId)
      .filter((event) => input.action === undefined || event.action === input.action)
      .filter((event) => input.actorId === undefined || event.actorId === input.actorId)
      .filter(
        (event) =>
          text === undefined ||
          `${event.action} ${event.targetType} ${event.targetId} ${event.reason}`.toLowerCase().includes(text),
      );
  }

  /** Exports audit events as JSON lines. */
  public exportJsonl(organizationId: string): string {
    return this.search({ organizationId }).map((event) => JSON.stringify(event)).join('\n');
  }
}
