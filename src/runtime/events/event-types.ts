import type { Disposable } from '@/runtime/utils';

/** Base shape for strongly typed runtime event maps. */
export type EventMap = object;

/** Runtime event envelope delivered to middleware and subscribers. */
export interface RuntimeEvent<Type extends string, Payload> {
  /** Fully qualified event type. */
  readonly type: Type;
  /** Event payload. */
  readonly payload: Payload;
  /** Emission timestamp. */
  readonly timestamp: number;
  /** Stable event id for replay and diagnostics. */
  readonly id: string;
  /** Optional namespace used for wildcard subscriptions. */
  readonly namespace: string;
}

/** Event listener options. */
export interface EventListenerOptions {
  /** Higher priority listeners run first. */
  readonly priority?: number;
  /** Listener is removed after first invocation. */
  readonly once?: boolean;
  /** Replays buffered matching events immediately after subscription. */
  readonly replay?: boolean;
}

/** Event middleware can observe or transform event delivery side effects. */
export type EventMiddleware<Events extends EventMap> = (
  event: RuntimeEvent<keyof Events & string, Events[keyof Events]>,
  next: () => Promise<void>,
) => Promise<void> | void;

/** Disposable subscription handle returned by event bus listeners. */
export interface EventSubscription extends Disposable {
  /** Event pattern this subscription listens to. */
  readonly pattern: string;
}

/** Observable metrics for event-bus health checks. */
export interface EventBusMetrics {
  /** Number of emitted events. */
  readonly emitted: number;
  /** Number of listener invocations. */
  readonly delivered: number;
  /** Number of events emitted with no listeners. */
  readonly deadEvents: number;
  /** Number of active subscriptions. */
  readonly subscriptions: number;
}
