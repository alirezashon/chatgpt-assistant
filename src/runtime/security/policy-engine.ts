import type {
  AuthorizationRequest,
  PolicyDecision,
  RiskAssessment,
  SecurityPolicy,
  SecurityPolicyCondition,
  SecurityValue,
  TrustLevel,
} from './security-types';

const TRUST_RANK: Readonly<Record<TrustLevel, number>> = {
  'enterprise-approved': 4,
  limited: 1,
  trusted: 3,
  unknown: 0,
  verified: 2,
};

/** Caches deterministic permission decisions for low-latency repeated checks. */
export class PermissionCache {
  private readonly cache = new Map<string, { readonly expiresAt: number; readonly value: PolicyDecision }>();

  /** Reads cached decision. */
  public get(key: string): PolicyDecision | undefined {
    const item = this.cache.get(key);

    if (item === undefined || item.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /** Stores cached decision. */
  public set(key: string, value: PolicyDecision, ttlMs = 2_000): void {
    this.cache.set(key, {
      expiresAt: Date.now() + ttlMs,
      value,
    });
  }

  /** Clears cache. */
  public clear(): void {
    this.cache.clear();
  }
}

/** Evaluates policy rules with deny-first semantics. */
export class PolicyEngine {
  private readonly policies = new Map<string, SecurityPolicy>();
  private readonly cache = new PermissionCache();

  /** Adds or replaces a policy. */
  public upsert(policy: SecurityPolicy): void {
    this.policies.set(policy.id, policy);
    this.cache.clear();
  }

  /** Removes a policy. */
  public remove(policyId: string): void {
    this.policies.delete(policyId);
    this.cache.clear();
  }

  /** Lists policies. */
  public list(): readonly SecurityPolicy[] {
    return [...this.policies.values()];
  }

  /** Evaluates all matching policies. */
  public evaluate(request: AuthorizationRequest, risk: RiskAssessment): PolicyDecision {
    const cacheKey = cacheKeyFor(request, risk);
    const cached = this.cache.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const matched = [...this.policies.values()]
      .filter((policy) => policy.enabled)
      .filter((policy) => policy.conditions.every((condition) => evaluateCondition(condition, request, risk)))
      .sort((left, right) => right.priority - left.priority);
    const deny = matched.find((policy) => policy.effect === 'deny');
    const approval = matched.find((policy) => policy.effect === 'require-approval');
    const allow = matched.find((policy) => policy.effect === 'allow');
    const decision = makeDecision(deny, approval, allow);

    this.cache.set(cacheKey, decision);
    return decision;
  }
}

function makeDecision(
  deny: SecurityPolicy | undefined,
  approval: SecurityPolicy | undefined,
  allow: SecurityPolicy | undefined,
): PolicyDecision {
  if (deny !== undefined) {
    return {
      decision: 'deny',
      policyIds: [deny.id],
      reason: deny.reason,
    };
  }

  if (approval !== undefined) {
    return {
      decision: 'require-approval',
      policyIds: [approval.id],
      reason: approval.reason,
    };
  }

  if (allow !== undefined) {
    return {
      decision: 'allow',
      policyIds: [allow.id],
      reason: allow.reason,
    };
  }

  return {
    decision: 'deny',
    policyIds: [],
    reason: 'No policy allowed this action.',
  };
}

function evaluateCondition(
  condition: SecurityPolicyCondition,
  request: AuthorizationRequest,
  risk: RiskAssessment,
): boolean {
  const actual = readAttribute(condition.attribute, request, risk);
  const expected = condition.value;

  switch (condition.operator) {
    case 'contains':
      return typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected);
    case 'eq':
      return actual === expected;
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'matches':
      return typeof actual === 'string' && typeof expected === 'string' && wildcardMatches(expected, actual);
    case 'neq':
      return actual !== expected;
  }
}

function readAttribute(
  attribute: SecurityPolicyCondition['attribute'],
  request: AuthorizationRequest,
  risk: RiskAssessment,
): SecurityValue {
  switch (attribute) {
    case 'action':
      return request.action;
    case 'capability':
      return request.capability;
    case 'principal.trustLevel':
      return request.context.actor.principal.trustLevel;
    case 'principal.type':
      return request.context.actor.principal.type;
    case 'resource.classification':
      return request.resource.classification;
    case 'resource.origin':
      return request.resource.origin ?? '';
    case 'resource.type':
      return request.resource.type;
    case 'risk.level':
      return risk.level;
  }
}

function wildcardMatches(pattern: string, value: string): boolean {
  if (pattern === value) {
    return true;
  }

  if (pattern.endsWith('*')) {
    return value.startsWith(pattern.slice(0, -1));
  }

  return false;
}

function cacheKeyFor(request: AuthorizationRequest, risk: RiskAssessment): string {
  return [
    request.context.actor.principal.id,
    request.capability,
    request.action,
    request.resource.id,
    request.resource.origin ?? '',
    request.resource.classification,
    risk.level,
    TRUST_RANK[request.context.actor.principal.trustLevel].toString(),
  ].join('|');
}
