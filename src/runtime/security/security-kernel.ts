import { EventBus } from '@/runtime/events';

import { SecurityAuditLogger } from './audit-logger';
import { CapabilityManager } from './capability-manager';
import { DataGovernanceManager } from './data-governance';
import { IdentityManager } from './identity-manager';
import { ApprovalManager } from './approval-manager';
import { PolicyEngine } from './policy-engine';
import { RiskEngine } from './risk-engine';
import { ThreatDetector } from './threat-detector';
import type {
  AuthorizationRequest,
  AuthorizationResult,
  SecurityApprovalDecision,
  SecurityApprovalRequest,
  SecurityCapability,
  SecurityPolicy,
  SecurityResource,
  SecurityRuntimeEvents,
} from './security-types';

/** Security kernel dependencies. */
export interface SecurityKernelDependencies {
  /** Identity manager. */
  readonly identities?: IdentityManager;
  /** Capability manager. */
  readonly capabilities?: CapabilityManager;
  /** Policy engine. */
  readonly policies?: PolicyEngine;
  /** Risk engine. */
  readonly risk?: RiskEngine;
  /** Approval manager. */
  readonly approvals?: ApprovalManager;
  /** Audit logger. */
  readonly audit?: SecurityAuditLogger;
  /** Threat detector. */
  readonly threats?: ThreatDetector;
  /** Data governance manager. */
  readonly data?: DataGovernanceManager;
  /** Event bus. */
  readonly events?: EventBus<SecurityRuntimeEvents>;
}

/** Central trust kernel that mediates action authorization for agents, plugins, workflows, and browser actions. */
export class SecurityKernel {
  /** Identity manager. */
  public readonly identities: IdentityManager;
  /** Capability manager. */
  public readonly capabilities: CapabilityManager;
  /** Policy engine. */
  public readonly policies: PolicyEngine;
  /** Risk engine. */
  public readonly risk: RiskEngine;
  /** Approval manager. */
  public readonly approvals: ApprovalManager;
  /** Audit logger. */
  public readonly audit: SecurityAuditLogger;
  /** Threat detector. */
  public readonly threats: ThreatDetector;
  /** Data governance. */
  public readonly data: DataGovernanceManager;
  /** Security events. */
  public readonly events: EventBus<SecurityRuntimeEvents>;

  public constructor(dependencies: SecurityKernelDependencies = {}) {
    this.identities = dependencies.identities ?? new IdentityManager();
    this.capabilities = dependencies.capabilities ?? new CapabilityManager();
    this.policies = dependencies.policies ?? new PolicyEngine();
    this.risk = dependencies.risk ?? new RiskEngine();
    this.approvals = dependencies.approvals ?? new ApprovalManager();
    this.audit = dependencies.audit ?? new SecurityAuditLogger();
    this.threats = dependencies.threats ?? new ThreatDetector();
    this.data = dependencies.data ?? new DataGovernanceManager();
    this.events = dependencies.events ?? new EventBus<SecurityRuntimeEvents>();
    installDefaultPolicies(this.policies);
  }

  /** Authorizes an action through identity, capability, policy, risk, approval, and audit. */
  public async authorize(request: AuthorizationRequest): Promise<AuthorizationResult> {
    const hasCapability = this.capabilities.hasCapability(
      request.context.actor.principal.id,
      request.capability,
      request.resource,
    );
    const risk = this.risk.assess(request);

    if (!hasCapability) {
      this.risk.recordDenied(request.context.actor.principal.id);
      return this.finish(request, {
        allowed: false,
        decision: 'deny',
        policyIds: [],
        reason: `Missing scoped capability: ${request.capability}`,
        risk,
      });
    }

    const policyDecision = this.policies.evaluate(request, risk);

    if (policyDecision.decision === 'deny') {
      this.risk.recordDenied(request.context.actor.principal.id);
      return this.finish(request, {
        allowed: false,
        decision: 'deny',
        policyIds: policyDecision.policyIds,
        reason: policyDecision.reason,
        risk,
      });
    }

    if (risk.level === 'critical') {
      this.risk.recordDenied(request.context.actor.principal.id);
      return this.finish(request, {
        allowed: false,
        decision: 'deny',
        policyIds: policyDecision.policyIds,
        reason: 'Critical risk actions are blocked by default.',
        risk,
      });
    }

    if (policyDecision.decision === 'require-approval' || risk.level === 'high') {
      const approval = this.approvals.request(request, risk);
      await this.events.emit('security.approvalRequested', approval);
      return this.finish(request, {
        allowed: false,
        approvalId: approval.id,
        decision: 'require-approval',
        policyIds: policyDecision.policyIds,
        reason: policyDecision.reason,
        risk,
      });
    }

    return this.finish(request, {
      allowed: true,
      decision: 'allow',
      policyIds: policyDecision.policyIds,
      reason: policyDecision.reason,
      risk,
    });
  }

  /** Applies an approval decision. */
  public decideApproval(decision: SecurityApprovalDecision): SecurityApprovalRequest {
    return this.approvals.decide(decision);
  }

  /** Convenience authorization request builder. */
  public request(input: {
    readonly action: string;
    readonly capability: SecurityCapability;
    readonly reason: string;
    readonly resource: SecurityResource;
    readonly sessionId: string;
  }): AuthorizationRequest {
    return {
      action: input.action,
      capability: input.capability,
      context: this.identities.context(input.sessionId),
      reason: input.reason,
      resource: input.resource,
    };
  }

  /** Detects and emits prompt injection threats. */
  public async inspectUntrustedContent(content: string): Promise<void> {
    for (const threat of this.threats.detectPromptInjection(content)) {
      await this.events.emit('security.threatDetected', threat);
    }
  }

  private async finish(
    request: AuthorizationRequest,
    result: AuthorizationResult,
  ): Promise<AuthorizationResult> {
    const auditEvent = this.audit.record(request, result);
    await this.events.emit('security.audit', auditEvent);
    await this.events.emit('security.decision', result);
    return result;
  }
}

function installDefaultPolicies(policies: PolicyEngine): void {
  for (const policy of defaultPolicies()) {
    policies.upsert(policy);
  }
}

function defaultPolicies(): readonly SecurityPolicy[] {
  return [
    {
      conditions: [
        { attribute: 'principal.type', operator: 'eq', value: 'plugin' },
        { attribute: 'capability', operator: 'eq', value: 'memory.read' },
      ],
      effect: 'deny',
      enabled: true,
      id: 'system.deny-plugin-memory-read',
      priority: 1_000,
      reason: 'Plugins cannot read memory unless a narrower future policy explicitly delegates through a broker.',
      source: 'system',
    },
    {
      conditions: [
        { attribute: 'principal.type', operator: 'eq', value: 'agent' },
        { attribute: 'resource.origin', operator: 'contains', value: 'bank' },
      ],
      effect: 'deny',
      enabled: true,
      id: 'system.deny-agent-banking-origin',
      priority: 950,
      reason: 'Agents cannot act on banking origins.',
      source: 'system',
    },
    {
      conditions: [{ attribute: 'capability', operator: 'in', value: ['filesystem.write', 'plugin.install', 'clipboard.write'] }],
      effect: 'require-approval',
      enabled: true,
      id: 'system.approval-sensitive-mutations',
      priority: 700,
      reason: 'Sensitive mutation requires human approval.',
      source: 'system',
    },
    {
      conditions: [
        { attribute: 'principal.trustLevel', operator: 'in', value: ['limited', 'verified', 'trusted', 'enterprise-approved'] },
        { attribute: 'risk.level', operator: 'in', value: ['low', 'medium', 'high'] },
      ],
      effect: 'allow',
      enabled: true,
      id: 'system.allow-scoped-capabilities',
      priority: 100,
      reason: 'Scoped capability and acceptable risk allow execution.',
      source: 'system',
    },
  ];
}

/** Creates a resource descriptor. */
export function securityResource(input: {
  readonly classification?: SecurityResource['classification'];
  readonly id: string;
  readonly origin?: string;
  readonly ownerId?: string;
  readonly type: string;
  readonly uri?: string;
}): SecurityResource {
  return {
    classification: input.classification ?? 'internal',
    id: input.id,
    ...(input.origin === undefined ? {} : { origin: input.origin }),
    ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
    type: input.type,
    ...(input.uri === undefined ? {} : { uri: input.uri }),
  };
}
