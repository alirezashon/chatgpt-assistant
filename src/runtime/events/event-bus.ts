import { createDisposable, RuntimeError, type Disposable } from '@/runtime/utils';

import type {
  EventBusMetrics,
  EventListenerOptions,
  EventMap,
  EventMiddleware,
  EventSubscription,
  RuntimeEvent,
} from './event-types';

interface ListenerRecord<Events extends EventMap> {
  readonly id: number;
  readonly pattern: string;
  readonly priority: number;
  readonly once: boolean;
  readonly listener: (
    event: RuntimeEvent<keyof Events & string, Events[keyof Events]>,
  ) => void | Promise<void>;
}

/** Fully typed event bus used by kernel, modules, services, and tests. */
export class EventBus<Events extends EventMap> implements Disposable {
  private readonly listeners = new Map<string, ListenerRecord<Events>[]>();
  private readonly middleware: EventMiddleware<Events>[] = [];
  private readonly replayBuffer: RuntimeEvent<keyof Events & string, Events[keyof Events]>[] = [];
  private readonly replayLimit: number;
  private disposed = false;
  private nextListenerId = 1;
  private emitted = 0;
  private delivered = 0;
  private deadEvents = 0;

  public constructor(replayLimit = 100) {
    this.replayLimit = replayLimit;
  }

  /** Returns current event-bus metrics. */
  public getMetrics(): EventBusMetrics {
    return {
      deadEvents: this.deadEvents,
      delivered: this.delivered,
      emitted: this.emitted,
      subscriptions: [...this.listeners.values()].reduce(
        (count, records) => count + records.length,
        0,
      ),
    };
  }

  /** Installs middleware that wraps every event delivery. */
  public use(middleware: EventMiddleware<Events>): Disposable {
    this.assertActive();
    this.middleware.push(middleware);

    return createDisposable(() => {
      const index = this.middleware.indexOf(middleware);

      if (index >= 0) {
        this.middleware.splice(index, 1);
      }
    });
  }

  /** Subscribes to an exact event type. */
  public on<Type extends keyof Events & string>(
    type: Type,
    listener: (event: RuntimeEvent<Type, Events[Type]>) => void | Promise<void>,
    options: EventListenerOptions = {},
  ): EventSubscription {
    return this.subscribe(type, listener as ListenerRecord<Events>['listener'], options);
  }

  /** Subscribes to a namespace wildcard such as "kernel.*" or to "*" for all events. */
  public onPattern(
    pattern: string,
    listener: (
      event: RuntimeEvent<keyof Events & string, Events[keyof Events]>,
    ) => void | Promise<void>,
    options: EventListenerOptions = {},
  ): EventSubscription {
    return this.subscribe(pattern, listener, options);
  }

  /** Emits an event asynchronously through middleware and matching listeners. */
  public async emit<Type extends keyof Events & string>(
    type: Type,
    payload: Events[Type],
  ): Promise<void> {
    this.assertActive();

    const event: RuntimeEvent<Type, Events[Type]> = {
      id: crypto.randomUUID(),
      namespace: getNamespace(type),
      payload,
      timestamp: Date.now(),
      type,
    };

    this.emitted += 1;
    this.remember(event);

    const matchingListeners = this.getMatchingListeners(type);

    if (matchingListeners.length === 0) {
      this.deadEvents += 1;
      return;
    }

    await this.dispatchWithMiddleware(event, async () => {
      for (const record of matchingListeners) {
        await record.listener(event);
        this.delivered += 1;

        if (record.once) {
          this.remove(record.pattern, record.id);
        }
      }
    });
  }

  /** Emits an event without awaiting asynchronous listeners. */
  public emitSync<Type extends keyof Events & string>(type: Type, payload: Events[Type]): void {
    void this.emit(type, payload);
  }

  /** Releases all listeners, middleware, and replay data. */
  public dispose(): void {
    this.disposed = true;
    this.listeners.clear();
    this.middleware.length = 0;
    this.replayBuffer.length = 0;
  }

  private subscribe(
    pattern: string,
    listener: ListenerRecord<Events>['listener'],
    options: EventListenerOptions,
  ): EventSubscription {
    this.assertActive();

    const record: ListenerRecord<Events> = {
      id: this.nextListenerId,
      listener,
      once: options.once ?? false,
      pattern,
      priority: options.priority ?? 0,
    };

    this.nextListenerId += 1;

    const records = this.listeners.get(pattern) ?? [];
    records.push(record);
    records.sort((left, right) => right.priority - left.priority || left.id - right.id);
    this.listeners.set(pattern, records);

    if (options.replay === true) {
      for (const event of this.replayBuffer.filter((item) => matchesPattern(pattern, item.type))) {
        void record.listener(event);
      }
    }

    return {
      pattern,
      dispose: () => {
        this.remove(pattern, record.id);
      },
    };
  }

  private remove(pattern: string, id: number): void {
    const records = this.listeners.get(pattern);

    if (records === undefined) {
      return;
    }

    const nextRecords = records.filter((record) => record.id !== id);

    if (nextRecords.length === 0) {
      this.listeners.delete(pattern);
      return;
    }

    this.listeners.set(pattern, nextRecords);
  }

  private getMatchingListeners(type: string): ListenerRecord<Events>[] {
    return [...this.listeners.entries()]
      .filter(([pattern]) => matchesPattern(pattern, type))
      .flatMap(([, records]) => records)
      .sort((left, right) => right.priority - left.priority || left.id - right.id);
  }

  private remember(event: RuntimeEvent<keyof Events & string, Events[keyof Events]>): void {
    this.replayBuffer.push(event);

    while (this.replayBuffer.length > this.replayLimit) {
      this.replayBuffer.shift();
    }
  }

  private async dispatchWithMiddleware(
    event: RuntimeEvent<keyof Events & string, Events[keyof Events]>,
    dispatch: () => Promise<void>,
  ): Promise<void> {
    let index = -1;

    const run = async (nextIndex: number): Promise<void> => {
      if (nextIndex <= index) {
        throw new RuntimeError('INVALID_STATE', 'Event middleware called next more than once.');
      }

      index = nextIndex;
      const middleware = this.middleware[nextIndex];

      if (middleware === undefined) {
        await dispatch();
        return;
      }

      await middleware(event, () => run(nextIndex + 1));
    };

    await run(0);
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new RuntimeError('DISPOSED', 'Event bus has been disposed.');
    }
  }
}

function getNamespace(type: string): string {
  const separatorIndex = type.indexOf('.');

  return separatorIndex === -1 ? type : type.slice(0, separatorIndex);
}

function matchesPattern(pattern: string, type: string): boolean {
  if (pattern === '*') {
    return true;
  }

  if (pattern.endsWith('.*')) {
    return type.startsWith(pattern.slice(0, -1));
  }

  return pattern === type;
}
