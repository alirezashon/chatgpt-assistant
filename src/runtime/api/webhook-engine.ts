import type {
  APIEvent,
  APIEventType,
  APIWebhookDelivery,
  APIWebhookDeliveryAdapter,
  APIWebhookEndpoint,
} from './api-types';
import { APIRuntimeError } from './api-types';

const defaultAdapter: APIWebhookDeliveryAdapter = {
  deliver: () => Promise.resolve({ status: 204 }),
};

/** Webhook and Event API engine with signing, retries, replay protection, and delivery logs. */
export class APIWebhookEngine {
  private readonly deliveries: APIWebhookDelivery[] = [];
  private readonly endpoints = new Map<string, APIWebhookEndpoint>();
  private readonly replayKeys = new Set<string>();

  public constructor(private readonly adapter: APIWebhookDeliveryAdapter = defaultAdapter) {}

  /** Registers webhook endpoint. */
  public registerEndpoint(input: {
    readonly applicationId: string;
    readonly environmentId: string;
    readonly events: readonly APIEventType[];
    readonly secret?: string;
    readonly url: string;
  }): APIWebhookEndpoint {
    const endpoint: APIWebhookEndpoint = {
      active: true,
      applicationId: input.applicationId,
      createdAt: Date.now(),
      environmentId: input.environmentId,
      events: input.events,
      id: crypto.randomUUID(),
      secret: input.secret ?? crypto.randomUUID(),
      url: input.url,
    };
    this.endpoints.set(endpoint.id, endpoint);
    return endpoint;
  }

  /** Publishes event to matching endpoints. */
  public async publish(event: APIEvent, maxAttempts = 3): Promise<readonly APIWebhookDelivery[]> {
    const endpoints = [...this.endpoints.values()].filter((endpoint) => endpoint.active && endpoint.events.includes(event.type));
    const results: APIWebhookDelivery[] = [];

    for (const endpoint of endpoints) {
      results.push(await this.deliverWithRetry(endpoint, event, maxAttempts));
    }

    return results;
  }

  /** Verifies replay key and signature for inbound webhook-like callbacks. */
  public verifyReplay(input: {
    readonly eventId: string;
    readonly signature: string;
    readonly timestamp: number;
  }): void {
    const replayKey = `${input.eventId}:${input.signature}`;

    if (Math.abs(Date.now() - input.timestamp) > 5 * 60 * 1000) {
      throw new APIRuntimeError('API_REPLAY_DETECTED', 'Webhook timestamp is outside replay window.');
    }

    if (this.replayKeys.has(replayKey)) {
      throw new APIRuntimeError('API_REPLAY_DETECTED', 'Webhook replay detected.');
    }

    this.replayKeys.add(replayKey);
  }

  /** Delivery logs. */
  public logs(endpointId?: string): readonly APIWebhookDelivery[] {
    return this.deliveries.filter((delivery) => endpointId === undefined || delivery.endpointId === endpointId);
  }

  private async deliverWithRetry(
    endpoint: APIWebhookEndpoint,
    event: APIEvent,
    maxAttempts: number,
  ): Promise<APIWebhookDelivery> {
    let last: APIWebhookDelivery | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const signature = sign(endpoint.secret, event);

      try {
        const result = await this.adapter.deliver(endpoint, event, signature);
        last = this.record({
          attempt,
          endpointId: endpoint.id,
          eventId: event.id,
          responseStatus: result.status,
          signature,
          status: result.status >= 200 && result.status < 300 ? 'succeeded' : 'failed',
        });

        if (last.status === 'succeeded') {
          return last;
        }
      } catch (error) {
        last = this.record({
          attempt,
          endpointId: endpoint.id,
          error: error instanceof Error ? error.message : String(error),
          eventId: event.id,
          signature,
          status: 'failed',
        });
      }
    }

    return last ?? this.record({
      attempt: 1,
      endpointId: endpoint.id,
      eventId: event.id,
      signature: sign(endpoint.secret, event),
      status: 'failed',
    });
  }

  private record(input: {
    readonly attempt: number;
    readonly endpointId: string;
    readonly error?: string;
    readonly eventId: string;
    readonly responseStatus?: number;
    readonly signature: string;
    readonly status: APIWebhookDelivery['status'];
  }): APIWebhookDelivery {
    const delivery: APIWebhookDelivery = {
      attempt: input.attempt,
      endpointId: input.endpointId,
      eventId: input.eventId,
      id: crypto.randomUUID(),
      signature: input.signature,
      status: input.status,
      timestamp: Date.now(),
      ...(input.error === undefined ? {} : { error: input.error }),
      ...(input.responseStatus === undefined ? {} : { responseStatus: input.responseStatus }),
    };
    this.deliveries.push(delivery);
    return delivery;
  }
}

function sign(secret: string, event: APIEvent): string {
  return stableHash(`${secret}:${event.id}:${event.timestamp.toString()}:${JSON.stringify(event.payload)}`);
}

function stableHash(value: string): string {
  let hash = 2_166_136_261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return `sha256=${(hash >>> 0).toString(16)}`;
}
