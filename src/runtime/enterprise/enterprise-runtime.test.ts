import { describe, expect, it } from 'vitest';

import { EnterpriseAdminApi } from './admin-api';
import { EnterpriseRuntime } from './enterprise-runtime';
import { EnterpriseRuntimeError } from './enterprise-types';

describe('EnterpriseRuntime', () => {
  it('keeps organization resources isolated across tenants', () => {
    const runtime = new EnterpriseRuntime();
    const { organization: first, owner: firstOwner } = bootstrap(runtime, 'Acme', 'acme');
    const { organization: second } = bootstrap(runtime, 'Globex', 'globex');
    const resource = runtime.registerResource({
      actorId: firstOwner.id,
      classification: 'private',
      name: 'Engineering handbook',
      organizationId: first.id,
      ownerId: firstOwner.id,
      retentionDays: 365,
      type: 'document',
    });

    expect(runtime.getResource(first.id, resource.id).id).toBe(resource.id);
    expect(() => runtime.getResource(second.id, resource.id)).toThrow(EnterpriseRuntimeError);
  });

  it('supports custom roles without core changes', () => {
    const runtime = new EnterpriseRuntime();
    const { organization, owner, workspace } = bootstrap(runtime, 'Acme', 'acme');
    const researcher = runtime.createUser({
      displayName: 'Researcher',
      email: 'researcher@example.com',
    });
    runtime.addMembership({
      actorId: owner.id,
      organizationId: organization.id,
      userId: researcher.id,
    });
    const role = runtime.createRole({
      actorId: owner.id,
      description: 'Can manage knowledge spaces and use approved AI models.',
      name: 'AI Researcher',
      organizationId: organization.id,
      permissions: ['ai.model.use', 'knowledge.manage', 'resource.read'],
      scope: 'workspace',
    });

    runtime.bindRole({
      actorId: owner.id,
      organizationId: organization.id,
      principalId: researcher.id,
      principalType: 'user',
      roleId: role.id,
      scope: 'workspace',
      scopeId: workspace.id,
    });

    const knowledge = runtime.createKnowledgeSpace({
      actorId: researcher.id,
      name: 'Company research',
      organizationId: organization.id,
      sourceTypes: ['documents', 'repositories'],
      workspaceId: workspace.id,
    });

    expect(knowledge.organizationId).toBe(organization.id);
    expect(runtime.can({
      organizationId: organization.id,
      permission: 'knowledge.manage',
      principalId: researcher.id,
      scope: 'workspace',
      scopeId: workspace.id,
    })).toBe(true);
  });

  it('enforces enterprise AI governance policies', () => {
    const runtime = new EnterpriseRuntime();
    const { organization, owner } = bootstrap(runtime, 'Acme', 'acme');
    runtime.upsertPolicy({
      actorId: owner.id,
      policy: {
        conditions: [{ attribute: 'provider', operator: 'neq', value: 'approved-ai' }],
        domain: 'ai-model',
        effect: 'deny',
        enabled: true,
        name: 'Deny external AI providers',
        organizationId: organization.id,
        priority: 100,
        reason: 'Employees cannot use external AI models.',
      },
    });
    runtime.upsertPolicy({
      actorId: owner.id,
      policy: {
        conditions: [{ attribute: 'provider', operator: 'eq', value: 'approved-ai' }],
        domain: 'ai-model',
        effect: 'allow',
        enabled: true,
        name: 'Allow approved AI provider',
        organizationId: organization.id,
        priority: 10,
        reason: 'Approved enterprise AI provider.',
      },
    });

    expect(runtime.canUseModel({
      model: 'frontier',
      organizationId: organization.id,
      provider: 'external-ai',
      userId: owner.id,
    }).decision).toBe('deny');
    expect(runtime.canUseModel({
      model: 'enterprise-model',
      organizationId: organization.id,
      provider: 'approved-ai',
      userId: owner.id,
    }).decision).toBe('allow');
  });

  it('meters usage and prepares billing summaries', () => {
    const runtime = new EnterpriseRuntime();
    const { organization, owner } = bootstrap(runtime, 'Acme', 'acme');

    runtime.recordUsage({
      actorId: owner.id,
      metric: 'ai-request',
      organizationId: organization.id,
      quantity: 3,
      userId: owner.id,
    });
    runtime.recordUsage({
      actorId: owner.id,
      metric: 'ai-token',
      model: 'enterprise-model',
      organizationId: organization.id,
      quantity: 10_000,
      userId: owner.id,
    });

    const summary = runtime.billingSummary(organization.id);

    expect(summary.aiRequests).toBe(3);
    expect(summary.tokensUsed).toBe(10_000);
    expect(summary.estimatedCost).toBeGreaterThan(0);
  });

  it('exposes scoped admin APIs and audit export', () => {
    const runtime = new EnterpriseRuntime();
    const admin = new EnterpriseAdminApi(runtime);
    const { organization, owner } = bootstrap(runtime, 'Acme', 'acme');

    const users = admin.users({
      actorId: owner.id,
      organizationId: organization.id,
    });
    const auditJsonl = admin.exportAudit({
      actorId: owner.id,
      organizationId: organization.id,
    });

    expect(users.map((user) => user.id)).toContain(owner.id);
    expect(auditJsonl).toContain('organization.create');
    expect(admin.billing({ actorId: owner.id, organizationId: organization.id }).seats).toBe(1);
  });
});

function bootstrap(runtime: EnterpriseRuntime, name: string, slug: string) {
  const organization = runtime.createOrganization({
    actorId: 'system',
    name,
    plan: 'enterprise',
    slug,
  });
  const owner = runtime.createUser({
    displayName: `${name} Owner`,
    email: `owner@${slug}.example.com`,
  });
  runtime.addMembership({
    actorId: 'system',
    organizationId: organization.id,
    userId: owner.id,
  });
  runtime.bindRole({
    actorId: 'system',
    organizationId: organization.id,
    principalId: owner.id,
    principalType: 'user',
    roleId: runtime.findRole(organization.id, 'owner').id,
    scope: 'organization',
    scopeId: organization.id,
  });
  const workspace = runtime.createWorkspace({
    actorId: owner.id,
    name: 'Default',
    organizationId: organization.id,
  });

  return { organization, owner, workspace };
}
