import type {
  EnterprisePermission,
  EnterpriseRole,
  EnterpriseRoleBinding,
  EnterpriseRoleScope,
} from './enterprise-types';

/** Dynamic RBAC engine with built-in role templates and custom-role support. */
export class EnterpriseRbacEngine {
  /** Evaluates whether a principal has a permission in scope. */
  public can(input: {
    readonly bindings: readonly EnterpriseRoleBinding[];
    readonly organizationId: string;
    readonly permission: EnterprisePermission;
    readonly principalId: string;
    readonly roles: readonly EnterpriseRole[];
    readonly scope: EnterpriseRoleScope;
    readonly scopeId: string;
  }): boolean {
    const roleById = new Map(input.roles.map((role) => [role.id, role]));
    return input.bindings
      .filter((binding) => binding.organizationId === input.organizationId)
      .filter((binding) => binding.principalId === input.principalId)
      .filter((binding) => binding.scope === input.scope || binding.scope === 'organization')
      .filter((binding) => binding.scopeId === input.scopeId || binding.scope === 'organization')
      .some((binding) => roleById.get(binding.roleId)?.permissions.includes(input.permission) === true);
  }
}

/** Creates standard role templates for an organization. */
export function createBuiltInRoles(organizationId: string): readonly EnterpriseRole[] {
  const now = Date.now();
  return [
    role(organizationId, 'owner', 'Organization Owner', 'Full organization control.', [
      'admin.audit.read',
      'admin.billing.manage',
      'admin.billing.read',
      'admin.identity.manage',
      'admin.policy.manage',
      'admin.security.manage',
      'agent.manage',
      'ai.model.approve',
      'ai.model.use',
      'billing.usage.record',
      'knowledge.manage',
      'plugin.approve',
      'project.manage',
      'resource.export',
      'resource.read',
      'resource.write',
      'team.manage',
      'workflow.manage',
      'workspace.manage',
    ], now),
    role(organizationId, 'administrator', 'Administrator', 'Manage users, workspaces, teams, and platform settings.', [
      'admin.identity.manage',
      'admin.policy.manage',
      'admin.billing.read',
      'agent.manage',
      'knowledge.manage',
      'project.manage',
      'resource.read',
      'team.manage',
      'workflow.manage',
      'workspace.manage',
    ], now),
    role(organizationId, 'security-admin', 'Security Admin', 'Manage security, policy, audit, and approvals.', [
      'admin.audit.read',
      'admin.policy.manage',
      'admin.security.manage',
      'ai.model.approve',
      'plugin.approve',
      'resource.export',
      'resource.read',
    ], now),
    role(organizationId, 'developer', 'Developer', 'Build and run approved agents, workflows, and resources.', [
      'agent.manage',
      'ai.model.use',
      'knowledge.manage',
      'project.manage',
      'resource.read',
      'resource.write',
      'workflow.manage',
    ], now),
    role(organizationId, 'member', 'Member', 'Use approved AI platform resources.', [
      'ai.model.use',
      'resource.read',
    ], now),
    role(organizationId, 'guest', 'Guest', 'Limited read-only access.', ['resource.read'], now),
  ];
}

function role(
  organizationId: string,
  idSuffix: string,
  name: string,
  description: string,
  permissions: readonly EnterprisePermission[],
  createdAt: number,
): EnterpriseRole {
  return {
    builtIn: true,
    createdAt,
    description,
    id: `${organizationId}:${idSuffix}`,
    name,
    organizationId,
    permissions,
    scope: 'organization',
  };
}
