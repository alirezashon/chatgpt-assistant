/** Stable Security Kernel version. */
export const SECURITY_KERNEL_VERSION = '1.0.0';

/** JSON-like value safe for persisted security metadata. */
export type SecurityValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: SecurityValue }
  | readonly SecurityValue[];

/** Actor type. */
export type IdentityType = 'agent' | 'command' | 'external-service' | 'human' | 'plugin' | 'workflow';

/** Trust level. */
export type TrustLevel = 'enterprise-approved' | 'limited' | 'trusted' | 'unknown' | 'verified';

/** Security capability. */
export type SecurityCapability =
  | 'ai.request'
  | 'browser.click'
  | 'browser.navigate'
  | 'browser.read'
  | 'browser.type'
  | 'clipboard.read'
  | 'clipboard.write'
  | 'filesystem.read'
  | 'filesystem.write'
  | 'memory.read'
  | 'memory.write'
  | 'network.request'
  | 'plugin.install'
  | 'plugin.execute'
  | 'workflow.execute';

/** Data classification. */
export type DataClassification = 'internal' | 'private' | 'public' | 'restricted' | 'sensitive';

/** Policy source. */
export type SecurityPolicySource = 'agent' | 'enterprise' | 'plugin' | 'system' | 'user' | 'workflow';

/** Policy effect. */
export type SecurityPolicyEffect = 'allow' | 'deny' | 'require-approval';

/** Authorization decision. */
export type SecurityDecision = 'allow' | 'deny' | 'require-approval';

/** Risk level. */
export type RiskLevel = 'critical' | 'high' | 'low' | 'medium';

/** Approval status. */
export type ApprovalStatus = 'approved' | 'expired' | 'modified' | 'pending' | 'rejected';

/** Threat severity. */
export type ThreatSeverity = 'critical' | 'high' | 'low' | 'medium';

/** Identity. */
export interface SecurityIdentity {
  /** Identity id. */
  readonly id: string;
  /** Type. */
  readonly type: IdentityType;
  /** Display name. */
  readonly displayName: string;
  /** Trust level. */
  readonly trustLevel: TrustLevel;
  /** Owner id. */
  readonly ownerId?: string;
  /** Created timestamp. */
  readonly createdAt: number;
  /** Disabled timestamp. */
  readonly disabledAt?: number;
  /** Metadata. */
  readonly metadata: Readonly<Record<string, SecurityValue>>;
}

/** Principal derived from identity. */
export interface SecurityPrincipal {
  /** Principal id. */
  readonly id: string;
  /** Identity id. */
  readonly identityId: string;
  /** Type. */
  readonly type: IdentityType;
  /** Display name. */
  readonly displayName: string;
  /** Trust level. */
  readonly trustLevel: TrustLevel;
}

/** Actor. */
export interface SecurityActor {
  /** Principal. */
  readonly principal: SecurityPrincipal;
  /** Current session id. */
  readonly sessionId: string;
}

/** Security session. */
export interface SecuritySession {
  /** Session id. */
  readonly id: string;
  /** Principal. */
  readonly principal: SecurityPrincipal;
  /** Started timestamp. */
  readonly startedAt: number;
  /** Expiration timestamp. */
  readonly expiresAt: number;
  /** Revoked timestamp. */
  readonly revokedAt?: number;
}

/** Identity context attached to every action. */
export interface IdentityContext {
  /** Actor. */
  readonly actor: SecurityActor;
  /** Session. */
  readonly session: SecuritySession;
  /** Request id. */
  readonly requestId: string;
}

/** Capability scope. */
export interface CapabilityScope {
  /** Resource types. */
  readonly resourceTypes?: readonly string[];
  /** URL origin patterns. */
  readonly origins?: readonly string[];
  /** Resource ids. */
  readonly resourceIds?: readonly string[];
  /** Data classifications. */
  readonly dataClassifications?: readonly DataClassification[];
  /** Expiration timestamp. */
  readonly expiresAt?: number;
}

/** Capability grant. */
export interface CapabilityGrant {
  /** Grant id. */
  readonly id: string;
  /** Principal id. */
  readonly principalId: string;
  /** Capability. */
  readonly capability: SecurityCapability;
  /** Scope. */
  readonly scope: CapabilityScope;
  /** Reason. */
  readonly reason: string;
  /** Created timestamp. */
  readonly createdAt: number;
  /** Revoked timestamp. */
  readonly revokedAt?: number;
}

/** Resource. */
export interface SecurityResource {
  /** Resource type. */
  readonly type: string;
  /** Resource id. */
  readonly id: string;
  /** URI. */
  readonly uri?: string;
  /** Origin. */
  readonly origin?: string;
  /** Data classification. */
  readonly classification: DataClassification;
  /** Owner id. */
  readonly ownerId?: string;
}

/** Policy condition attribute. */
export type PolicyAttribute =
  | 'action'
  | 'capability'
  | 'principal.trustLevel'
  | 'principal.type'
  | 'resource.classification'
  | 'resource.origin'
  | 'resource.type'
  | 'risk.level';

/** Policy condition. */
export interface SecurityPolicyCondition {
  /** Attribute. */
  readonly attribute: PolicyAttribute;
  /** Operator. */
  readonly operator: 'contains' | 'eq' | 'in' | 'matches' | 'neq';
  /** Value. */
  readonly value: SecurityValue;
}

/** Policy. */
export interface SecurityPolicy {
  /** Policy id. */
  readonly id: string;
  /** Source. */
  readonly source: SecurityPolicySource;
  /** Priority, higher evaluated first. */
  readonly priority: number;
  /** Effect. */
  readonly effect: SecurityPolicyEffect;
  /** Conditions. */
  readonly conditions: readonly SecurityPolicyCondition[];
  /** Explanation. */
  readonly reason: string;
  /** Enabled flag. */
  readonly enabled: boolean;
}

/** Authorization request. */
export interface AuthorizationRequest {
  /** Identity context. */
  readonly context: IdentityContext;
  /** Capability requested. */
  readonly capability: SecurityCapability;
  /** Action name. */
  readonly action: string;
  /** Resource. */
  readonly resource: SecurityResource;
  /** Justification. */
  readonly reason: string;
  /** Optional safe metadata. */
  readonly metadata?: Readonly<Record<string, SecurityValue>>;
}

/** Risk assessment. */
export interface RiskAssessment {
  /** Risk level. */
  readonly level: RiskLevel;
  /** Numeric score 0-100. */
  readonly score: number;
  /** Factors. */
  readonly factors: readonly string[];
}

/** Policy decision result. */
export interface PolicyDecision {
  /** Decision. */
  readonly decision: SecurityDecision;
  /** Matched policy ids. */
  readonly policyIds: readonly string[];
  /** Explanation. */
  readonly reason: string;
}

/** Authorization result. */
export interface AuthorizationResult {
  /** Decision. */
  readonly decision: SecurityDecision;
  /** Whether execution may continue now. */
  readonly allowed: boolean;
  /** Risk. */
  readonly risk: RiskAssessment;
  /** Reason. */
  readonly reason: string;
  /** Approval id when needed. */
  readonly approvalId?: string;
  /** Matched policy ids. */
  readonly policyIds: readonly string[];
}

/** Audit event. */
export interface SecurityAuditEvent {
  /** Event id. */
  readonly id: string;
  /** Timestamp. */
  readonly timestamp: number;
  /** Principal id. */
  readonly principalId: string;
  /** Identity type. */
  readonly identityType: IdentityType;
  /** Capability. */
  readonly capability: SecurityCapability;
  /** Action. */
  readonly action: string;
  /** Resource id. */
  readonly resourceId: string;
  /** Decision. */
  readonly decision: SecurityDecision;
  /** Allowed flag. */
  readonly allowed: boolean;
  /** Risk level. */
  readonly risk: RiskLevel;
  /** Reason. */
  readonly reason: string;
  /** Safe details. */
  readonly details: Readonly<Record<string, SecurityValue>>;
}

/** Approval request. */
export interface SecurityApprovalRequest {
  /** Approval id. */
  readonly id: string;
  /** Authorization request. */
  readonly request: AuthorizationRequest;
  /** Risk. */
  readonly risk: RiskAssessment;
  /** Status. */
  readonly status: ApprovalStatus;
  /** Created timestamp. */
  readonly createdAt: number;
  /** Expiration timestamp. */
  readonly expiresAt: number;
  /** Decided timestamp. */
  readonly decidedAt?: number;
  /** Modified metadata. */
  readonly modifiedMetadata?: Readonly<Record<string, SecurityValue>>;
  /** Comment. */
  readonly comment?: string;
}

/** Approval decision input. */
export interface SecurityApprovalDecision {
  /** Approval id. */
  readonly approvalId: string;
  /** Decision. */
  readonly decision: 'approved' | 'modified' | 'rejected';
  /** Optional modified metadata. */
  readonly modifiedMetadata?: Readonly<Record<string, SecurityValue>>;
  /** Comment. */
  readonly comment?: string;
}

/** Threat event. */
export interface SecurityThreatEvent {
  /** Threat id. */
  readonly id: string;
  /** Type. */
  readonly type: 'anomaly' | 'data-leak' | 'plugin-abuse' | 'prompt-injection' | 'sensitive-page';
  /** Severity. */
  readonly severity: ThreatSeverity;
  /** Summary. */
  readonly summary: string;
  /** Evidence. */
  readonly evidence: readonly string[];
  /** Recommended response. */
  readonly response: 'block' | 'notify' | 'quarantine' | 'revoke' | 'rollback';
  /** Timestamp. */
  readonly timestamp: number;
}

/** Governed data record. */
export interface GovernedDataRecord {
  /** Data id. */
  readonly id: string;
  /** Owner id. */
  readonly ownerId: string;
  /** Origin. */
  readonly origin: string;
  /** Classification. */
  readonly classification: DataClassification;
  /** Permissions. */
  readonly permissions: readonly SecurityCapability[];
  /** Retention expiration timestamp. */
  readonly expiresAt?: number;
  /** Access history. */
  readonly accessHistory: readonly {
    readonly principalId: string;
    readonly timestamp: number;
    readonly action: string;
  }[];
}

/** Runtime events. */
export interface SecurityRuntimeEvents {
  readonly 'security.approvalRequested': SecurityApprovalRequest;
  readonly 'security.audit': SecurityAuditEvent;
  readonly 'security.decision': AuthorizationResult;
  readonly 'security.threatDetected': SecurityThreatEvent;
}

/** Runtime error code. */
export type SecurityRuntimeErrorCode =
  | 'SECURITY_APPROVAL_NOT_FOUND'
  | 'SECURITY_CAPABILITY_DENIED'
  | 'SECURITY_IDENTITY_NOT_FOUND'
  | 'SECURITY_POLICY_DENIED'
  | 'SECURITY_SESSION_INVALID';

/** Structured security error. */
export class SecurityRuntimeError extends Error {
  /** Stable code. */
  public readonly code: SecurityRuntimeErrorCode;

  /** Safe details. */
  public readonly details: Readonly<Record<string, SecurityValue>> | undefined;

  public constructor(
    code: SecurityRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, SecurityValue>>,
  ) {
    super(message);
    this.name = 'SecurityRuntimeError';
    this.code = code;
    this.details = details;
  }
}
