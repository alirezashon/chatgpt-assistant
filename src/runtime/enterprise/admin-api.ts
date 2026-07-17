import type {
  EnterpriseAuditEvent,
  EnterpriseBillingSummary,
  EnterprisePermission,
  EnterprisePolicy,
  EnterpriseResource,
  EnterpriseUsageEvent,
  EnterpriseUser,
  EnterpriseWorkspace,
} from './enterprise-types';
import type { EnterpriseRuntime } from './enterprise-runtime';

/** Scoped admin-control API for future dashboard, automation, and compliance surfaces. */
export class EnterpriseAdminApi {
  public constructor(private readonly runtime: EnterpriseRuntime) {}

  /** Lists users. */
  public users(input: {
    readonly actorId: string;
    readonly organizationId: string;
  }): readonly EnterpriseUser[] {
    this.assert(input.organizationId, input.actorId, 'admin.identity.manage');
    return this.runtime.listUsers(input.organizationId);
  }

  /** Lists workspaces. */
  public workspaces(input: {
    readonly actorId: string;
    readonly organizationId: string;
  }): readonly EnterpriseWorkspace[] {
    this.assert(input.organizationId, input.actorId, 'workspace.manage');
    return this.runtime.listWorkspaces(input.organizationId);
  }

  /** Lists resources. */
  public resources(input: {
    readonly actorId: string;
    readonly organizationId: string;
  }): readonly EnterpriseResource[] {
    this.assert(input.organizationId, input.actorId, 'resource.read');
    return this.runtime.listResources(input.organizationId);
  }

  /** Lists audit events. */
  public auditEvents(input: {
    readonly actorId: string;
    readonly organizationId: string;
    readonly text?: string;
  }): readonly EnterpriseAuditEvent[] {
    this.assert(input.organizationId, input.actorId, 'admin.audit.read');
    return this.runtime.audit.search({
      organizationId: input.organizationId,
      ...(input.text === undefined ? {} : { text: input.text }),
    });
  }

  /** Exports audit as JSONL. */
  public exportAudit(input: {
    readonly actorId: string;
    readonly organizationId: string;
  }): string {
    this.assert(input.organizationId, input.actorId, 'admin.audit.read');
    return this.runtime.audit.exportJsonl(input.organizationId);
  }

  /** Billing summary. */
  public billing(input: {
    readonly actorId: string;
    readonly organizationId: string;
  }): EnterpriseBillingSummary {
    this.assert(input.organizationId, input.actorId, 'admin.billing.read');
    return this.runtime.billingSummary(input.organizationId);
  }

  /** Usage events. */
  public usage(input: {
    readonly actorId: string;
    readonly organizationId: string;
  }): readonly EnterpriseUsageEvent[] {
    this.assert(input.organizationId, input.actorId, 'admin.billing.read');
    return this.runtime.usage.list(input.organizationId);
  }

  /** Policies. */
  public policies(input: {
    readonly actorId: string;
    readonly organizationId: string;
  }): readonly EnterprisePolicy[] {
    this.assert(input.organizationId, input.actorId, 'admin.policy.manage');
    return this.runtime.policies.list(input.organizationId);
  }

  private assert(organizationId: string, actorId: string, permission: EnterprisePermission): void {
    if (actorId === 'system') {
      return;
    }

    if (
      !this.runtime.can({
        organizationId,
        permission,
        principalId: actorId,
        scope: 'organization',
        scopeId: organizationId,
      })
    ) {
      throw new Error(`Admin API permission denied: ${permission}`);
    }
  }
}
