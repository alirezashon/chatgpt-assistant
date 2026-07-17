import type {
  EnterpriseBillingAccount,
  EnterpriseBillingSummary,
  EnterprisePlan,
  EnterpriseUsageEvent,
  EnterpriseUsageMetric,
} from './enterprise-types';

/** Organization-scoped usage meter. */
export class EnterpriseUsageMeter {
  private readonly events: EnterpriseUsageEvent[] = [];

  /** Records usage. */
  public record(input: {
    readonly agentId?: string;
    readonly metric: EnterpriseUsageMetric;
    readonly model?: string;
    readonly organizationId: string;
    readonly pluginId?: string;
    readonly quantity: number;
    readonly userId: string;
    readonly workflowId?: string;
  }): EnterpriseUsageEvent {
    const event: EnterpriseUsageEvent = {
      id: crypto.randomUUID(),
      metric: input.metric,
      organizationId: input.organizationId,
      quantity: input.quantity,
      timestamp: Date.now(),
      userId: input.userId,
      ...(input.agentId === undefined ? {} : { agentId: input.agentId }),
      ...(input.model === undefined ? {} : { model: input.model }),
      ...(input.pluginId === undefined ? {} : { pluginId: input.pluginId }),
      ...(input.workflowId === undefined ? {} : { workflowId: input.workflowId }),
    };
    this.events.push(event);
    return event;
  }

  /** Lists usage. */
  public list(organizationId: string): readonly EnterpriseUsageEvent[] {
    return this.events.filter((event) => event.organizationId === organizationId);
  }
}

/** Billing foundation for plans, seats, credits, limits, and usage reports. */
export class EnterpriseBillingManager {
  private readonly accounts = new Map<string, EnterpriseBillingAccount>();

  /** Creates billing account. */
  public createAccount(input: {
    readonly aiCredits?: number;
    readonly organizationId: string;
    readonly plan: EnterprisePlan;
    readonly seats: number;
    readonly tokenLimit?: number;
    readonly usageLimit?: number;
  }): EnterpriseBillingAccount {
    const account: EnterpriseBillingAccount = {
      aiCredits: input.aiCredits ?? defaultCredits(input.plan),
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      plan: input.plan,
      seats: input.seats,
      tokenLimit: input.tokenLimit ?? defaultTokenLimit(input.plan),
      usageLimit: input.usageLimit ?? defaultUsageLimit(input.plan),
    };
    this.accounts.set(input.organizationId, account);
    return account;
  }

  /** Reads billing account. */
  public requireAccount(organizationId: string): EnterpriseBillingAccount {
    const account = this.accounts.get(organizationId);

    if (account === undefined) {
      throw new Error(`Billing account not found: ${organizationId}`);
    }

    return account;
  }

  /** Builds billing summary. */
  public summary(organizationId: string, usage: readonly EnterpriseUsageEvent[]): EnterpriseBillingSummary {
    const account = this.requireAccount(organizationId);
    const tokensUsed = usage.filter((event) => event.metric === 'ai-token').reduce((sum, event) => sum + event.quantity, 0);
    const aiRequests = usage.filter((event) => event.metric === 'ai-request').reduce((sum, event) => sum + event.quantity, 0);

    return {
      aiCredits: account.aiCredits,
      aiRequests,
      estimatedCost: aiRequests * 0.01 + tokensUsed * 0.000002,
      organizationId,
      seats: account.seats,
      tokensUsed,
    };
  }
}

function defaultCredits(plan: EnterprisePlan): number {
  return plan === 'enterprise' ? 1_000_000 : plan === 'business' ? 250_000 : plan === 'pro' ? 50_000 : 5_000;
}

function defaultTokenLimit(plan: EnterprisePlan): number {
  return plan === 'enterprise' ? 50_000_000 : plan === 'business' ? 10_000_000 : plan === 'pro' ? 1_000_000 : 100_000;
}

function defaultUsageLimit(plan: EnterprisePlan): number {
  return plan === 'enterprise' ? 10_000_000 : plan === 'business' ? 1_000_000 : plan === 'pro' ? 100_000 : 10_000;
}
