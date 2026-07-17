import { EnterpriseAuditLog } from './audit-log';
import { EnterprisePolicyEngine } from './policy-engine';
import { createBuiltInRoles, EnterpriseRbacEngine } from './rbac-engine';
import { EnterpriseBillingManager, EnterpriseUsageMeter } from './usage-billing';
import type {
  EnterpriseBillingSummary,
  EnterpriseDataClassification,
  EnterpriseDeploymentMode,
  EnterpriseEnvironment,
  EnterpriseEnvironmentType,
  EnterpriseKnowledgeSpace,
  EnterpriseMembership,
  EnterpriseOrganization,
  EnterprisePermission,
  EnterprisePlan,
  EnterprisePolicy,
  EnterprisePolicyRequest,
  EnterprisePolicyResult,
  EnterpriseProject,
  EnterpriseResource,
  EnterpriseRole,
  EnterpriseRoleBinding,
  EnterpriseRoleScope,
  EnterpriseServiceAccount,
  EnterpriseTeam,
  EnterpriseUsageEvent,
  EnterpriseUser,
  EnterpriseValue,
  EnterpriseWorkspace,
} from './enterprise-types';
import { EnterpriseRuntimeError } from './enterprise-types';

/** Enterprise runtime dependencies. */
export interface EnterpriseRuntimeDependencies {
  readonly audit?: EnterpriseAuditLog;
  readonly billing?: EnterpriseBillingManager;
  readonly policies?: EnterprisePolicyEngine;
  readonly rbac?: EnterpriseRbacEngine;
  readonly usage?: EnterpriseUsageMeter;
}

/** Enterprise organization platform runtime. */
export class EnterpriseRuntime {
  public readonly audit: EnterpriseAuditLog;
  public readonly billing: EnterpriseBillingManager;
  public readonly policies: EnterprisePolicyEngine;
  public readonly rbac: EnterpriseRbacEngine;
  public readonly usage: EnterpriseUsageMeter;

  private readonly environments = new Map<string, EnterpriseEnvironment>();
  private readonly knowledgeSpaces = new Map<string, EnterpriseKnowledgeSpace>();
  private readonly memberships = new Map<string, EnterpriseMembership>();
  private readonly organizations = new Map<string, EnterpriseOrganization>();
  private readonly projects = new Map<string, EnterpriseProject>();
  private readonly resources = new Map<string, EnterpriseResource>();
  private readonly roleBindings = new Map<string, EnterpriseRoleBinding>();
  private readonly roles = new Map<string, EnterpriseRole>();
  private readonly serviceAccounts = new Map<string, EnterpriseServiceAccount>();
  private readonly teams = new Map<string, EnterpriseTeam>();
  private readonly users = new Map<string, EnterpriseUser>();
  private readonly workspaces = new Map<string, EnterpriseWorkspace>();

  public constructor(dependencies: EnterpriseRuntimeDependencies = {}) {
    this.audit = dependencies.audit ?? new EnterpriseAuditLog();
    this.billing = dependencies.billing ?? new EnterpriseBillingManager();
    this.policies = dependencies.policies ?? new EnterprisePolicyEngine();
    this.rbac = dependencies.rbac ?? new EnterpriseRbacEngine();
    this.usage = dependencies.usage ?? new EnterpriseUsageMeter();
  }

  /** Creates an organization with built-in role templates and billing account. */
  public createOrganization(input: {
    readonly actorId: string;
    readonly deploymentMode?: EnterpriseDeploymentMode;
    readonly metadata?: Readonly<Record<string, EnterpriseValue>>;
    readonly name: string;
    readonly plan?: EnterprisePlan;
    readonly slug: string;
  }): EnterpriseOrganization {
    const organization: EnterpriseOrganization = {
      createdAt: Date.now(),
      deploymentMode: input.deploymentMode ?? 'cloud-saas',
      id: crypto.randomUUID(),
      metadata: input.metadata ?? {},
      name: input.name,
      plan: input.plan ?? 'business',
      slug: input.slug,
    };
    this.organizations.set(organization.id, organization);
    for (const role of createBuiltInRoles(organization.id)) {
      this.roles.set(role.id, role);
    }
    this.billing.createAccount({
      organizationId: organization.id,
      plan: organization.plan,
      seats: 1,
    });
    this.auditAllowed(organization.id, input.actorId, 'organization.create', 'organization', organization.id, 'Organization created.');
    return organization;
  }

  /** Creates a user account. */
  public createUser(input: {
    readonly displayName: string;
    readonly email: string;
  }): EnterpriseUser {
    const user: EnterpriseUser = {
      createdAt: Date.now(),
      displayName: input.displayName,
      email: input.email.toLowerCase(),
      id: crypto.randomUUID(),
      status: 'active',
    };
    this.users.set(user.id, user);
    return user;
  }

  /** Adds user membership to an organization. */
  public addMembership(input: {
    readonly actorId: string;
    readonly organizationId: string;
    readonly userId: string;
  }): EnterpriseMembership {
    this.requireOrganization(input.organizationId);
    this.requireUser(input.userId);
    const membership: EnterpriseMembership = {
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      status: 'active',
      userId: input.userId,
    };
    this.memberships.set(membership.id, membership);
    this.auditAllowed(input.organizationId, input.actorId, 'membership.add', 'user', input.userId, 'User added to organization.');
    return membership;
  }

  /** Creates a workspace. */
  public createWorkspace(input: {
    readonly actorId: string;
    readonly name: string;
    readonly organizationId: string;
  }): EnterpriseWorkspace {
    this.requirePermission(input.organizationId, input.actorId, 'workspace.manage', 'organization', input.organizationId);
    const workspace: EnterpriseWorkspace = {
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      name: input.name,
      organizationId: input.organizationId,
    };
    this.workspaces.set(workspace.id, workspace);
    this.auditAllowed(input.organizationId, input.actorId, 'workspace.create', 'workspace', workspace.id, 'Workspace created.');
    return workspace;
  }

  /** Creates a team. */
  public createTeam(input: {
    readonly actorId: string;
    readonly memberUserIds?: readonly string[];
    readonly name: string;
    readonly organizationId: string;
    readonly workspaceId: string;
  }): EnterpriseTeam {
    this.requirePermission(input.organizationId, input.actorId, 'team.manage', 'workspace', input.workspaceId);
    this.assertWorkspaceInOrganization(input.workspaceId, input.organizationId);
    const team: EnterpriseTeam = {
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      memberUserIds: input.memberUserIds ?? [],
      name: input.name,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
    };
    this.teams.set(team.id, team);
    this.auditAllowed(input.organizationId, input.actorId, 'team.create', 'team', team.id, 'Team created.');
    return team;
  }

  /** Creates a custom role. */
  public createRole(input: {
    readonly actorId: string;
    readonly description: string;
    readonly name: string;
    readonly organizationId: string;
    readonly permissions: readonly EnterprisePermission[];
    readonly scope: EnterpriseRoleScope;
  }): EnterpriseRole {
    this.requirePermission(input.organizationId, input.actorId, 'admin.identity.manage', 'organization', input.organizationId);
    const role: EnterpriseRole = {
      builtIn: false,
      createdAt: Date.now(),
      description: input.description,
      id: crypto.randomUUID(),
      name: input.name,
      organizationId: input.organizationId,
      permissions: input.permissions,
      scope: input.scope,
    };
    this.roles.set(role.id, role);
    this.auditAllowed(input.organizationId, input.actorId, 'role.create', 'role', role.id, 'Custom role created.');
    return role;
  }

  /** Binds a role to a principal. */
  public bindRole(input: {
    readonly actorId: string;
    readonly organizationId: string;
    readonly principalId: string;
    readonly principalType: EnterpriseRoleBinding['principalType'];
    readonly roleId: string;
    readonly scope: EnterpriseRoleScope;
    readonly scopeId: string;
  }): EnterpriseRoleBinding {
    if (input.actorId !== 'system') {
      this.requirePermission(input.organizationId, input.actorId, 'admin.identity.manage', 'organization', input.organizationId);
    }
    const role = this.requireRole(input.roleId);
    this.assertSameOrganization(role.organizationId, input.organizationId, 'role');
    const binding: EnterpriseRoleBinding = {
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      principalId: input.principalId,
      principalType: input.principalType,
      roleId: input.roleId,
      scope: input.scope,
      scopeId: input.scopeId,
    };
    this.roleBindings.set(binding.id, binding);
    this.auditAllowed(input.organizationId, input.actorId, 'role.bind', 'role-binding', binding.id, 'Role bound.');
    return binding;
  }

  /** Creates project. */
  public createProject(input: {
    readonly actorId: string;
    readonly name: string;
    readonly organizationId: string;
    readonly workspaceId: string;
  }): EnterpriseProject {
    this.requirePermission(input.organizationId, input.actorId, 'project.manage', 'workspace', input.workspaceId);
    this.assertWorkspaceInOrganization(input.workspaceId, input.organizationId);
    const project: EnterpriseProject = {
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      name: input.name,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
    };
    this.projects.set(project.id, project);
    this.auditAllowed(input.organizationId, input.actorId, 'project.create', 'project', project.id, 'Project created.');
    return project;
  }

  /** Creates environment. */
  public createEnvironment(input: {
    readonly actorId: string;
    readonly name: string;
    readonly organizationId: string;
    readonly projectId: string;
    readonly type: EnterpriseEnvironmentType;
  }): EnterpriseEnvironment {
    this.requirePermission(input.organizationId, input.actorId, 'project.manage', 'project', input.projectId);
    this.assertProjectInOrganization(input.projectId, input.organizationId);
    const environment: EnterpriseEnvironment = {
      id: crypto.randomUUID(),
      name: input.name,
      organizationId: input.organizationId,
      projectId: input.projectId,
      type: input.type,
    };
    this.environments.set(environment.id, environment);
    this.auditAllowed(input.organizationId, input.actorId, 'environment.create', 'environment', environment.id, 'Environment created.');
    return environment;
  }

  /** Adds or replaces enterprise policy. */
  public upsertPolicy(input: {
    readonly actorId: string;
    readonly policy: Omit<EnterprisePolicy, 'createdAt' | 'id'> & { readonly id?: string };
  }): EnterprisePolicy {
    this.requirePermission(input.policy.organizationId, input.actorId, 'admin.policy.manage', 'organization', input.policy.organizationId);
    const policy: EnterprisePolicy = {
      ...input.policy,
      createdAt: Date.now(),
      id: input.policy.id ?? crypto.randomUUID(),
    };
    this.policies.upsert(policy);
    this.auditAllowed(policy.organizationId, input.actorId, 'policy.upsert', 'policy', policy.id, 'Policy updated.');
    return policy;
  }

  /** Evaluates enterprise policy and audits the decision. */
  public evaluatePolicy(request: EnterprisePolicyRequest): EnterprisePolicyResult {
    const result = this.policies.evaluate(request);
    this.audit.record({
      action: `policy.evaluate.${request.domain}`,
      actorId: request.userId,
      decision: result.decision === 'deny' ? 'denied' : 'allowed',
      details: {
        policyIds: result.policyIds.join(','),
      },
      organizationId: request.organizationId,
      reason: result.reason,
      targetId: request.action,
      targetType: 'policy-request',
    });
    return result;
  }

  /** Checks AI model governance. */
  public canUseModel(input: {
    readonly model: string;
    readonly organizationId: string;
    readonly provider: string;
    readonly userId: string;
  }): EnterprisePolicyResult {
    return this.evaluatePolicy({
      action: 'ai.model.use',
      attributes: {
        model: input.model,
        provider: input.provider,
      },
      domain: 'ai-model',
      organizationId: input.organizationId,
      userId: input.userId,
    });
  }

  /** Registers governed resource. */
  public registerResource(input: {
    readonly actorId: string;
    readonly classification: EnterpriseDataClassification;
    readonly name: string;
    readonly organizationId: string;
    readonly ownerId: string;
    readonly policyIds?: readonly string[];
    readonly retentionDays: number;
    readonly type: string;
  }): EnterpriseResource {
    this.requirePermission(input.organizationId, input.actorId, 'resource.write', 'organization', input.organizationId);
    const resource: EnterpriseResource = {
      accessPolicyIds: input.policyIds ?? [],
      classification: input.classification,
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      name: input.name,
      organizationId: input.organizationId,
      ownerId: input.ownerId,
      retentionDays: input.retentionDays,
      type: input.type,
    };
    this.resources.set(resource.id, resource);
    this.auditAllowed(input.organizationId, input.actorId, 'resource.register', 'resource', resource.id, 'Resource registered.');
    return resource;
  }

  /** Creates company knowledge space. */
  public createKnowledgeSpace(input: {
    readonly actorId: string;
    readonly graphEnabled?: boolean;
    readonly name: string;
    readonly organizationId: string;
    readonly sourceTypes: readonly string[];
    readonly workspaceId: string;
  }): EnterpriseKnowledgeSpace {
    this.requirePermission(input.organizationId, input.actorId, 'knowledge.manage', 'workspace', input.workspaceId);
    this.assertWorkspaceInOrganization(input.workspaceId, input.organizationId);
    const space: EnterpriseKnowledgeSpace = {
      createdAt: Date.now(),
      graphEnabled: input.graphEnabled ?? true,
      id: crypto.randomUUID(),
      name: input.name,
      organizationId: input.organizationId,
      sourceTypes: input.sourceTypes,
      workspaceId: input.workspaceId,
    };
    this.knowledgeSpaces.set(space.id, space);
    this.auditAllowed(input.organizationId, input.actorId, 'knowledge.create', 'knowledge-space', space.id, 'Knowledge space created.');
    return space;
  }

  /** Records usage and enforces billing limits. */
  public recordUsage(input: Omit<Parameters<EnterpriseUsageMeter['record']>[0], 'organizationId'> & {
    readonly actorId: string;
    readonly organizationId: string;
  }): EnterpriseUsageEvent {
    this.requirePermission(input.organizationId, input.actorId, 'billing.usage.record', 'organization', input.organizationId);
    const account = this.billing.requireAccount(input.organizationId);
    const summary = this.billing.summary(input.organizationId, this.usage.list(input.organizationId));

    if (summary.tokensUsed >= account.tokenLimit) {
      throw new EnterpriseRuntimeError('ENTERPRISE_QUOTA_EXCEEDED', 'Organization token limit exceeded.', {
        organizationId: input.organizationId,
      });
    }

    const event = this.usage.record(input);
    this.auditAllowed(input.organizationId, input.actorId, 'usage.record', 'usage-event', event.id, 'Usage recorded.');
    return event;
  }

  /** Returns billing summary. */
  public billingSummary(organizationId: string): EnterpriseBillingSummary {
    return this.billing.summary(organizationId, this.usage.list(organizationId));
  }

  /** Lists workspaces in organization. */
  public listWorkspaces(organizationId: string): readonly EnterpriseWorkspace[] {
    return [...this.workspaces.values()].filter((workspace) => workspace.organizationId === organizationId);
  }

  /** Lists users in organization. */
  public listUsers(organizationId: string): readonly EnterpriseUser[] {
    const userIds = new Set(
      [...this.memberships.values()].filter((membership) => membership.organizationId === organizationId).map((membership) => membership.userId),
    );
    return [...this.users.values()].filter((user) => userIds.has(user.id));
  }

  /** Lists resources in organization. */
  public listResources(organizationId: string): readonly EnterpriseResource[] {
    return [...this.resources.values()].filter((resource) => resource.organizationId === organizationId);
  }

  /** Reads one resource with tenant isolation. */
  public getResource(organizationId: string, resourceId: string): EnterpriseResource {
    const resource = this.resources.get(resourceId);

    if (resource === undefined) {
      throw new EnterpriseRuntimeError('ENTERPRISE_NOT_FOUND', `Resource not found: ${resourceId}`);
    }

    this.assertSameOrganization(resource.organizationId, organizationId, 'resource');
    return resource;
  }

  /** Returns role by suffix or id. */
  public findRole(organizationId: string, roleNameOrId: string): EnterpriseRole {
    const role = [...this.roles.values()].find(
      (candidate) =>
        candidate.organizationId === organizationId &&
        (candidate.id === roleNameOrId || candidate.id.endsWith(`:${roleNameOrId}`) || candidate.name === roleNameOrId),
    );

    if (role === undefined) {
      throw new EnterpriseRuntimeError('ENTERPRISE_NOT_FOUND', `Role not found: ${roleNameOrId}`);
    }

    return role;
  }

  /** Permission check. */
  public can(input: {
    readonly organizationId: string;
    readonly permission: EnterprisePermission;
    readonly principalId: string;
    readonly scope: EnterpriseRoleScope;
    readonly scopeId: string;
  }): boolean {
    return this.rbac.can({
      bindings: [...this.roleBindings.values()],
      organizationId: input.organizationId,
      permission: input.permission,
      principalId: input.principalId,
      roles: [...this.roles.values()],
      scope: input.scope,
      scopeId: input.scopeId,
    });
  }

  private requirePermission(
    organizationId: string,
    principalId: string,
    permission: EnterprisePermission,
    scope: EnterpriseRoleScope,
    scopeId: string,
  ): void {
    if (principalId === 'system') {
      return;
    }

    if (!this.can({ organizationId, permission, principalId, scope, scopeId })) {
      this.audit.record({
        action: `permission.${permission}`,
        actorId: principalId,
        decision: 'denied',
        organizationId,
        reason: 'RBAC denied permission.',
        targetId: scopeId,
        targetType: scope,
      });
      throw new EnterpriseRuntimeError('ENTERPRISE_PERMISSION_DENIED', `Missing permission: ${permission}`, {
        organizationId,
        permission,
        principalId,
      });
    }
  }

  private assertWorkspaceInOrganization(workspaceId: string, organizationId: string): void {
    const workspace = this.workspaces.get(workspaceId);

    if (workspace === undefined) {
      throw new EnterpriseRuntimeError('ENTERPRISE_NOT_FOUND', `Workspace not found: ${workspaceId}`);
    }

    this.assertSameOrganization(workspace.organizationId, organizationId, 'workspace');
  }

  private assertProjectInOrganization(projectId: string, organizationId: string): void {
    const project = this.projects.get(projectId);

    if (project === undefined) {
      throw new EnterpriseRuntimeError('ENTERPRISE_NOT_FOUND', `Project not found: ${projectId}`);
    }

    this.assertSameOrganization(project.organizationId, organizationId, 'project');
  }

  private assertSameOrganization(actual: string, expected: string, targetType: string): void {
    if (actual !== expected) {
      throw new EnterpriseRuntimeError('ENTERPRISE_CROSS_TENANT_ACCESS', `Cross-organization ${targetType} access denied.`, {
        actual,
        expected,
      });
    }
  }

  private requireOrganization(organizationId: string): EnterpriseOrganization {
    const organization = this.organizations.get(organizationId);

    if (organization === undefined) {
      throw new EnterpriseRuntimeError('ENTERPRISE_NOT_FOUND', `Organization not found: ${organizationId}`);
    }

    return organization;
  }

  private requireUser(userId: string): EnterpriseUser {
    const user = this.users.get(userId);

    if (user === undefined) {
      throw new EnterpriseRuntimeError('ENTERPRISE_NOT_FOUND', `User not found: ${userId}`);
    }

    return user;
  }

  private requireRole(roleId: string): EnterpriseRole {
    const role = this.roles.get(roleId);

    if (role === undefined) {
      throw new EnterpriseRuntimeError('ENTERPRISE_NOT_FOUND', `Role not found: ${roleId}`);
    }

    return role;
  }

  private auditAllowed(
    organizationId: string,
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
    reason: string,
  ): void {
    this.audit.record({
      action,
      actorId,
      decision: 'allowed',
      organizationId,
      reason,
      targetId,
      targetType,
    });
  }
}
