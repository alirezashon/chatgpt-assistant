import type { SearchResponse } from '@/features/search/search-types';

export interface SearchEventMap {
  readonly indexUpdated: {
    readonly documentCount: number;
    readonly version: number;
  };
  readonly searchCompleted: {
    readonly response: SearchResponse;
  };
  readonly searchFailed: {
    readonly error: Error;
  };
  readonly searchStarted: {
    readonly query: string;
  };
}

export type SearchEventName = keyof SearchEventMap;
export type SearchEventListener<EventName extends SearchEventName> = (
  payload: SearchEventMap[EventName],
) => void;
export type SearchEventUnsubscribe = () => void;

export class SearchEvents {
  private readonly listeners = new Map<SearchEventName, Set<(payload: unknown) => void>>();

  public emit<EventName extends SearchEventName>(
    eventName: EventName,
    payload: SearchEventMap[EventName],
  ): void {
    const eventListeners = this.listeners.get(eventName);

    if (eventListeners === undefined) {
      return;
    }

    for (const listener of eventListeners) {
      listener(payload);
    }
  }

  public subscribe<EventName extends SearchEventName>(
    eventName: EventName,
    listener: SearchEventListener<EventName>,
  ): SearchEventUnsubscribe {
    const eventListeners = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    const wrappedListener = (payload: unknown) => {
      listener(payload as SearchEventMap[EventName]);
    };

    eventListeners.add(wrappedListener);
    this.listeners.set(eventName, eventListeners);

    return () => {
      eventListeners.delete(wrappedListener);
    };
  }
}
