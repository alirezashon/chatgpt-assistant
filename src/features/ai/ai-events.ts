import type { AIJob, AITaskResult } from '@/features/ai/ai-types';

export interface AIEventMap {
  readonly aiCacheInvalidated: {
    readonly reason: string;
  };
  readonly aiJobCancelled: {
    readonly jobId: string;
  };
  readonly aiJobCompleted: {
    readonly job: AIJob;
    readonly result: AITaskResult;
  };
  readonly aiJobFailed: {
    readonly error: Error;
    readonly job: AIJob;
  };
  readonly aiJobQueued: {
    readonly job: AIJob;
  };
  readonly aiJobRetrying: {
    readonly job: AIJob;
  };
  readonly aiJobStarted: {
    readonly job: AIJob;
  };
  readonly aiProviderRegistered: {
    readonly providerId: string;
  };
  readonly aiSettingsUpdated: {
    readonly providerId: string | null;
  };
}

export type AIEventName = keyof AIEventMap;
export type AIEventListener<EventName extends AIEventName> = (
  payload: AIEventMap[EventName],
) => void;
export type AIEventUnsubscribe = () => void;

export class AIEvents {
  private readonly listeners = new Map<AIEventName, Set<(payload: unknown) => void>>();

  public emit<EventName extends AIEventName>(
    eventName: EventName,
    payload: AIEventMap[EventName],
  ): void {
    const eventListeners = this.listeners.get(eventName);

    if (eventListeners === undefined) {
      return;
    }

    for (const listener of eventListeners) {
      listener(payload);
    }
  }

  public subscribe<EventName extends AIEventName>(
    eventName: EventName,
    listener: AIEventListener<EventName>,
  ): AIEventUnsubscribe {
    const eventListeners = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    const wrappedListener = (payload: unknown) => {
      listener(payload as AIEventMap[EventName]);
    };

    eventListeners.add(wrappedListener);
    this.listeners.set(eventName, eventListeners);

    return () => {
      eventListeners.delete(wrappedListener);
    };
  }
}
