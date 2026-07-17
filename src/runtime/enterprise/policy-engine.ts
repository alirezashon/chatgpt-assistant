import type {
  EnterprisePolicy,
  EnterprisePolicyCondition,
  EnterprisePolicyRequest,
  EnterprisePolicyResult,
  EnterpriseValue,
} from './enterprise-types';

/** Deny-first enterprise policy engine for AI, plugins, agents, workflows, memory, browser, and integrations. */
export class EnterprisePolicyEngine {
  private readonly policies = new Map<string, EnterprisePolicy>();

  /** Adds or replaces a policy. */
  public upsert(policy: EnterprisePolicy): void {
    this.policies.set(policy.id, policy);
  }

  /** Lists policies for an organization. */
  public list(organizationId: string): readonly EnterprisePolicy[] {
    return [...this.policies.values()].filter((policy) => policy.organizationId === organizationId);
  }

  /** Evaluates organization-scoped policy. */
  public evaluate(request: EnterprisePolicyRequest): EnterprisePolicyResult {
    const matched = this.list(request.organizationId)
      .filter((policy) => policy.enabled && policy.domain === request.domain)
      .filter((policy) => policy.conditions.every((condition) => evaluateCondition(condition, request)))
      .sort((left, right) => right.priority - left.priority);
    const deny = matched.find((policy) => policy.effect === 'deny');
    const approval = matched.find((policy) => policy.effect === 'require-approval');
    const allow = matched.find((policy) => policy.effect === 'allow');

    if (deny !== undefined) {
      return { decision: 'deny', policyIds: [deny.id], reason: deny.reason };
    }

    if (approval !== undefined) {
      return { decision: 'require-approval', policyIds: [approval.id], reason: approval.reason };
    }

    if (allow !== undefined) {
      return { decision: 'allow', policyIds: [allow.id], reason: allow.reason };
    }

    return { decision: 'deny', policyIds: [], reason: 'No enterprise policy allowed this action.' };
  }
}

function evaluateCondition(condition: EnterprisePolicyCondition, request: EnterprisePolicyRequest): boolean {
  const actual = readAttribute(condition.attribute, request);
  const expected = condition.value;

  switch (condition.operator) {
    case 'eq':
      return actual === expected;
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'neq':
      return actual !== expected;
  }
}

function readAttribute(attribute: EnterprisePolicyCondition['attribute'], request: EnterprisePolicyRequest): EnterpriseValue {
  if (attribute === 'domain') {
    return request.domain;
  }

  return request.attributes[attribute] ?? '';
}
