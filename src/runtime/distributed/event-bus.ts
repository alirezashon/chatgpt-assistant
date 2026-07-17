import { DistributedEventRegistry } from './event-registry';
import { EventSecurityManager } from './event-security';
import { DistributedTraceRecorder } from './trace-recorder';
import type {
  DistributedActor,
  DistributedEvent,
  DistributedSecurityContext,
  DistributedValue,
  EventConsumer,
  EventDeliveryRecord,
  EventSubscriptionDefinition,
  PlatformEventType,
} from './distributed-types';

/** Production-grade in-memory distributed event bus with schemas, delivery modes, retry, DLQ, ack, and replay. */
export class DistributedEventBus {
  private readonly consumers = new Map<string, EventConsumer>();
  private readonly deliveries: EventDeliveryRecord[] = [];
  private readonly eventLog: DistributedEvent[] = [];
  private readonly idempotencyKeys = new Set<string>();
  private readonly subscriptions = new Map<string, EventSubscriptionDefinition>();

  public constructor(
    public readonly registry = new DistributedEventRegistry(),
    private readonly security = new EventSecurityManager(),
    private readonly traces = new DistributedTraceRecorder(),
  ) {}

  /** Publishes a full event envelope. */
  public async publish(event: DistributedEvent): Promise<DistributedEvent> {
    this.security.assertCanPublish(event);
    this.registry.validate(event);

    if (event.deliveryMode === 'exactly-once' && event.idempotencyKey !== undefined) {
      if (this.idempotencyKeys.has(event.idempotencyKey)) {
        return event;
      }

      this.idempotencyKeys.add(event.idempotencyKey);
    }

    this.eventLog.push(event);
    const span = this.traces.start({
      attributes: { eventId: event.id, type: event.type },
      kind: 'event',
      name: `event.publish.${event.type}`,
      traceId: event.traceId,
    });
    await this.route(event);
    this.traces.end(span.id, 'ok');
    return event;
  }

  /** Creates and publishes an event envelope. */
  public publishEvent(input: {
    readonly actor: DistributedActor;
    readonly deliveryMode?: DistributedEvent['deliveryMode'];
    readonly idempotencyKey?: string;
    readonly metadata?: Readonly<Record<string, DistributedValue>>;
    readonly organizationId?: string;
    readonly payload: DistributedValue;
    readonly security: DistributedSecurityContext;
    readonly source: string;
    readonly traceId?: string;
    readonly type: PlatformEventType;
    readonly version?: number;
  }): Promise<DistributedEvent> {
    return this.publish({
      actor: input.actor,
      deliveryMode: input.deliveryMode ?? 'at-least-once',
      id: crypto.randomUUID(),
      ...(input.idempotencyKey === undefined ? {} : { idempotencyKey: input.idempotencyKey }),
      metadata: input.metadata ?? {},
      ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
      payload: input.payload,
      security: input.security,
      source: input.source,
      timestamp: Date.now(),
      traceId: input.traceId ?? crypto.randomUUID(),
      type: input.type,
      version: input.version ?? 1,
    });
  }

  /** Subscribes a consumer. */
  public subscribe(subscription: EventSubscriptionDefinition, consumer: EventConsumer): void {
    this.subscriptions.set(subscription.id, subscription);
    this.consumers.set(consumer.id, consumer);
  }

  /** Replays events by type pattern. */
  public async replay(input: {
    readonly fromTimestamp?: number;
    readonly pattern: string;
    readonly toTimestamp?: number;
  }): Promise<number> {
    const events = this.eventLog
      .filter((event) => matches(input.pattern, event.type))
      .filter((event) => input.fromTimestamp === undefined || event.timestamp >= input.fromTimestamp)
      .filter((event) => input.toTimestamp === undefined || event.timestamp <= input.toTimestamp);

    for (const event of events) {
      await this.route(event);
    }

    return events.length;
  }

  /** Lists delivery records. */
  public deliveryLog(): readonly EventDeliveryRecord[] {
    return this.deliveries;
  }

  /** Lists dead-letter records. */
  public deadLetters(): readonly EventDeliveryRecord[] {
    return this.deliveries.filter((delivery) => delivery.status === 'dead-lettered');
  }

  /** Event log. */
  public events(): readonly DistributedEvent[] {
    return this.eventLog;
  }

  /** Trace recorder. */
  public traceRecorder(): DistributedTraceRecorder {
    return this.traces;
  }

  private async route(event: DistributedEvent): Promise<void> {
    const subscriptions = [...this.subscriptions.values()].filter((subscription) => matches(subscription.pattern, event.type));

    for (const subscription of subscriptions) {
      await this.deliver(subscription, event);
    }
  }

  private async deliver(subscription: EventSubscriptionDefinition, event: DistributedEvent): Promise<void> {
    const consumer = this.consumers.get(subscription.consumerId);

    if (consumer === undefined) {
      return;
    }

    const attempts = subscription.deliveryMode === 'at-most-once' ? 1 : subscription.maxAttempts;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await consumer.handle(event);
        this.recordDelivery(subscription, event, attempt, 'acknowledged');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (attempt >= attempts) {
          this.recordDelivery(subscription, event, attempt, 'dead-lettered', message);
          return;
        }

        this.recordDelivery(subscription, event, attempt, 'failed', message);
      }
    }
  }

  private recordDelivery(
    subscription: EventSubscriptionDefinition,
    event: DistributedEvent,
    attempts: number,
    status: EventDeliveryRecord['status'],
    error?: string,
  ): void {
    this.deliveries.push({
      attempts,
      consumerId: subscription.consumerId,
      eventId: event.id,
      id: crypto.randomUUID(),
      ...(error === undefined ? {} : { error }),
      status,
      subscriptionId: subscription.id,
      timestamp: Date.now(),
    });
  }
}

function matches(pattern: string, type: string): boolean {
  return pattern === '*' || pattern === type || (pattern.endsWith('.*') && type.startsWith(pattern.slice(0, -1)));
}
