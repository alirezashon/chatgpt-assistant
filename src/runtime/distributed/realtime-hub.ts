import type { DistributedValue, RealtimePresence, RealtimeSubscription } from './distributed-types';

/** Realtime subscription and presence hub for live platform updates. */
export class RealtimeHub {
  private readonly messages: { readonly topic: string; readonly payload: DistributedValue; readonly timestamp: number }[] = [];
  private readonly presence = new Map<string, RealtimePresence>();
  private readonly subscriptions = new Map<string, RealtimeSubscription>();

  /** Subscribes a connection to a topic. */
  public subscribe(input: {
    readonly connectionId: string;
    readonly organizationId?: string;
    readonly topic: string;
  }): RealtimeSubscription {
    const subscription: RealtimeSubscription = {
      connectionId: input.connectionId,
      id: crypto.randomUUID(),
      ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
      topic: input.topic,
    };
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  /** Publishes a realtime update. */
  public publish(topic: string, payload: DistributedValue): readonly RealtimeSubscription[] {
    this.messages.push({ payload, timestamp: Date.now(), topic });
    return [...this.subscriptions.values()].filter((subscription) => subscription.topic === topic);
  }

  /** Updates presence. */
  public setPresence(input: {
    readonly connectionId: string;
    readonly status: RealtimePresence['status'];
    readonly topic: string;
    readonly userId: string;
  }): RealtimePresence {
    const presence: RealtimePresence = {
      connectionId: input.connectionId,
      status: input.status,
      topic: input.topic,
      updatedAt: Date.now(),
      userId: input.userId,
    };
    this.presence.set(`${input.topic}:${input.connectionId}`, presence);
    return presence;
  }

  /** Presence list. */
  public listPresence(topic: string): readonly RealtimePresence[] {
    return [...this.presence.values()].filter((presence) => presence.topic === topic);
  }

  /** Message log. */
  public messageLog(topic?: string) {
    return this.messages.filter((message) => topic === undefined || message.topic === topic);
  }
}
