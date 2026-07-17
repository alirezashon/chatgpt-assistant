/** Stable Enterprise Platform version. */
export const ENTERPRISE_PLATFORM_VERSION = '1.0.0';

/** JSON-like value safe for enterprise state. */
export type EnterpriseValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: EnterpriseValue }
  | readonly EnterpriseValue[];

/** Deployment mode. */
export type EnterpriseDeploymentMode = 'cloud-saas' | 'enterprise-vpc' | 'on-premise' | 'private-cloud';

/** Organization plan. */
export type EnterprisePlan = 'business' | 'enterprise' | 'free' | 'pro';

/** User status. */
export type EnterpriseUserStatus = 'active' | 'disabled' | 'invited' | 'suspended';

/** Data classification. */
export type EnterpriseDataClassification = 'internal' | 'private' | 'public' | 'restricted' | 'sensitive';

/** Environment type. */
export type EnterpriseEnvironmentType = 'development' | 'production' | 'staging' | 'test';

/** Enterprise permission. */
export type EnterprisePermission =
  | 'admin.audit.read'
  | 'admin.billing.manage'
  | 'admin.billing.read'
  | 'admin.identity.manage'
  | 'admin.policy.manage'
  | 'admin.security.manage'
  | 'agent.manage'
  | 'ai.model.approve'
  | 'ai.model.use'
  | 'billing.usage.record'
  | 'knowledge.manage'
  | 'plugin.approve'
  | 'project.manage'
  | 'resource.export'
  | 'resource.read'
  | 'resource.write'
  | 'team.manage'
  | 'workflow.manage'
  | 'workspace.manage';

/** Policy domain. */
export type EnterprisePolicyDomain =
  | 'agent'
  | 'ai-model'
  | 'browser'
  | 'data'
  | 'external-integration'
  | 'memory'
  | 'plugin'
  | 'workflow';

/** Policy effect. */
export type EnterprisePolicyEffect = 'allow' | 'deny' | 'require-approval';

/** Policy decision. */
export type EnterprisePolicyDecision = 'allow' | 'deny' | 'require-approval';

/** Usage metric type. */
export type EnterpriseUsageMetric =
  | 'agent-run'
  | 'ai-request'
  | 'ai-token'
  | 'plugin-execution'
  | 'storage-mb'
  | 'workflow-run';

/** Organization. */
export interface EnterpriseOrganization {
  /** Organization id. */
  readonly id: string;
  /** Name. */
  readonly name: string;
  /** Slug. */
  readonly slug: string;
  /** Plan. */
  readonly plan: EnterprisePlan;
  /** Deployment mode. */
  readonly deploymentMode: EnterpriseDeploymentMode;
  /** Created timestamp. */
  readonly createdAt: number;
  /** Metadata. */
  readonly metadata: Readonly<Record<string, EnterpriseValue>>;
}

/** Workspace. */
export interface EnterpriseWorkspace {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly createdAt: number;
}

/** Team. */
export interface EnterpriseTeam {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly memberUserIds: readonly string[];
  readonly createdAt: number;
}

/** Enterprise user account. */
export interface EnterpriseUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly status: EnterpriseUserStatus;
  readonly createdAt: number;
}

/** Service or AI identity. */
export interface EnterpriseServiceAccount {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly type: 'ai-identity' | 'service-account';
  readonly createdAt: number;
}

/** Organization membership. */
export interface EnterpriseMembership {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly status: EnterpriseUserStatus;
  readonly createdAt: number;
}

/** Role scope. */
export type EnterpriseRoleScope = 'organization' | 'project' | 'team' | 'workspace';

/** Role. */
export interface EnterpriseRole {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly description: string;
  readonly scope: EnterpriseRoleScope;
  readonly permissions: readonly EnterprisePermission[];
  readonly builtIn: boolean;
  readonly createdAt: number;
}

/** Role binding. */
export interface EnterpriseRoleBinding {
  readonly id: string;
  readonly organizationId: string;
  readonly principalId: string;
  readonly principalType: 'service-account' | 'team' | 'user';
  readonly roleId: string;
  readonly scopeId: string;
  readonly scope: EnterpriseRoleScope;
  readonly createdAt: number;
}

/** Project. */
export interface EnterpriseProject {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly createdAt: number;
}

/** Environment. */
export interface EnterpriseEnvironment {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly name: string;
  readonly type: EnterpriseEnvironmentType;
}

/** Governed resource. */
export interface EnterpriseResource {
  readonly id: string;
  readonly organizationId: string;
  readonly ownerId: string;
  readonly type: string;
  readonly name: string;
  readonly classification: EnterpriseDataClassification;
  readonly retentionDays: number;
  readonly accessPolicyIds: readonly string[];
  readonly createdAt: number;
}

/** Knowledge space. */
export interface EnterpriseKnowledgeSpace {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly sourceTypes: readonly string[];
  readonly graphEnabled: boolean;
  readonly createdAt: number;
}

/** Policy condition. */
export interface EnterprisePolicyCondition {
  readonly attribute:
    | 'domain'
    | 'model'
    | 'provider'
    | 'resource.classification'
    | 'resource.type'
    | 'user.status';
  readonly operator: 'eq' | 'in' | 'neq';
  readonly value: EnterpriseValue;
}

/** Enterprise policy. */
export interface EnterprisePolicy {
  readonly id: string;
  readonly organizationId: string;
  readonly domain: EnterprisePolicyDomain;
  readonly name: string;
  readonly effect: EnterprisePolicyEffect;
  readonly priority: number;
  readonly conditions: readonly EnterprisePolicyCondition[];
  readonly enabled: boolean;
  readonly reason: string;
  readonly createdAt: number;
}

/** Enterprise policy request. */
export interface EnterprisePolicyRequest {
  readonly organizationId: string;
  readonly userId: string;
  readonly domain: EnterprisePolicyDomain;
  readonly action: string;
  readonly attributes: Readonly<Record<string, EnterpriseValue>>;
}

/** Enterprise policy result. */
export interface EnterprisePolicyResult {
  readonly decision: EnterprisePolicyDecision;
  readonly policyIds: readonly string[];
  readonly reason: string;
}

/** Usage event. */
export interface EnterpriseUsageEvent {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly metric: EnterpriseUsageMetric;
  readonly quantity: number;
  readonly model?: string;
  readonly agentId?: string;
  readonly workflowId?: string;
  readonly pluginId?: string;
  readonly timestamp: number;
}

/** Billing account. */
export interface EnterpriseBillingAccount {
  readonly id: string;
  readonly organizationId: string;
  readonly plan: EnterprisePlan;
  readonly seats: number;
  readonly aiCredits: number;
  readonly tokenLimit: number;
  readonly usageLimit: number;
  readonly createdAt: number;
}

/** Billing summary. */
export interface EnterpriseBillingSummary {
  readonly organizationId: string;
  readonly seats: number;
  readonly aiCredits: number;
  readonly tokensUsed: number;
  readonly aiRequests: number;
  readonly estimatedCost: number;
}

/** Audit event. */
export interface EnterpriseAuditEvent {
  readonly id: string;
  readonly organizationId: string;
  readonly actorId: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly decision: 'allowed' | 'denied';
  readonly reason: string;
  readonly timestamp: number;
  readonly details: Readonly<Record<string, EnterpriseValue>>;
}

/** Enterprise runtime error code. */
export type EnterpriseRuntimeErrorCode =
  | 'ENTERPRISE_CROSS_TENANT_ACCESS'
  | 'ENTERPRISE_NOT_FOUND'
  | 'ENTERPRISE_PERMISSION_DENIED'
  | 'ENTERPRISE_POLICY_DENIED'
  | 'ENTERPRISE_QUOTA_EXCEEDED'
  | 'ENTERPRISE_VALIDATION_FAILED';

/** Structured enterprise error. */
export class EnterpriseRuntimeError extends Error {
  readonly code: EnterpriseRuntimeErrorCode;
  readonly details: Readonly<Record<string, EnterpriseValue>> | undefined;

  public constructor(
    code: EnterpriseRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, EnterpriseValue>>,
  ) {
    super(message);
    this.name = 'EnterpriseRuntimeError';
    this.code = code;
    this.details = details;
  }
}
