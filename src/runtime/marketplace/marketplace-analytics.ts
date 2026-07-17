import type {
  MarketplaceAnalyticsEvent,
  MarketplaceRevenueEvent,
  MarketplaceValue,
} from './marketplace-types';

/** Developer analytics and monetization ledger. */
export class MarketplaceAnalytics {
  private readonly analytics: MarketplaceAnalyticsEvent[] = [];
  private readonly revenue: MarketplaceRevenueEvent[] = [];

  /** Records analytics event. */
  public record(input: {
    readonly applicationId: string;
    readonly developerId: string;
    readonly metadata?: Readonly<Record<string, MarketplaceValue>>;
    readonly type: MarketplaceAnalyticsEvent['type'];
    readonly value: number;
  }): MarketplaceAnalyticsEvent {
    const event: MarketplaceAnalyticsEvent = {
      applicationId: input.applicationId,
      developerId: input.developerId,
      id: crypto.randomUUID(),
      metadata: input.metadata ?? {},
      timestamp: Date.now(),
      type: input.type,
      value: input.value,
    };
    this.analytics.push(event);
    return event;
  }

  /** Records revenue and payout split. */
  public recordRevenue(input: {
    readonly applicationId: string;
    readonly currency: string;
    readonly developerId: string;
    readonly grossCents: number;
    readonly revenueShareBps: number;
  }): MarketplaceRevenueEvent {
    const platformFeeCents = Math.round(input.grossCents * (10_000 - input.revenueShareBps) / 10_000);
    const event: MarketplaceRevenueEvent = {
      applicationId: input.applicationId,
      currency: input.currency,
      developerId: input.developerId,
      developerNetCents: input.grossCents - platformFeeCents,
      grossCents: input.grossCents,
      id: crypto.randomUUID(),
      platformFeeCents,
      timestamp: Date.now(),
    };
    this.revenue.push(event);
    this.record({
      applicationId: input.applicationId,
      developerId: input.developerId,
      metadata: { currency: input.currency },
      type: 'revenue',
      value: input.grossCents,
    });
    return event;
  }

  /** Analytics for developer. */
  public byDeveloper(developerId: string): readonly MarketplaceAnalyticsEvent[] {
    return this.analytics.filter((event) => event.developerId === developerId);
  }

  /** Revenue for developer. */
  public revenueByDeveloper(developerId: string): readonly MarketplaceRevenueEvent[] {
    return this.revenue.filter((event) => event.developerId === developerId);
  }
}
