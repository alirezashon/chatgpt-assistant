import type {
  ProviderCapabilities,
  ProviderConversation,
  ProviderIdentity,
  ProviderSession,
} from '@/platform/providers/provider-types';

export interface ProviderEventMap {
  readonly capabilityChanged: {
    readonly capabilities: ProviderCapabilities;
    readonly providerId: string;
  };
  readonly conversationOpened: {
    readonly conversation: ProviderConversation;
  };
  readonly providerChanged: {
    readonly providerId: string;
  };
  readonly providerConnected: {
    readonly session: ProviderSession;
  };
  readonly providerDisconnected: {
    readonly providerId: string;
    readonly sessionId?: string;
  };
  readonly providerRegistered: {
    readonly identity: ProviderIdentity;
  };
  readonly streamingFinished: {
    readonly streamId: string;
  };
  readonly streamingStarted: {
    readonly providerId: string;
    readonly streamId: string;
  };
}

export type ProviderEventName = keyof ProviderEventMap;
export type ProviderEventListener<EventName extends ProviderEventName> = (
  payload: ProviderEventMap[EventName],
) => void;
export type ProviderEventUnsubscribe = () => void;

export class ProviderEvents {
  private readonly listeners = new Map<ProviderEventName, Set<(payload: unknown) => void>>();

  public emit<EventName extends ProviderEventName>(
    eventName: EventName,
    payload: ProviderEventMap[EventName],
  ): void {
    const eventListeners = this.listeners.get(eventName);

    if (eventListeners === undefined) {
      return;
    }

    for (const listener of eventListeners) {
      listener(payload);
    }
  }

  public subscribe<EventName extends ProviderEventName>(
    eventName: EventName,
    listener: ProviderEventListener<EventName>,
  ): ProviderEventUnsubscribe {
    const eventListeners = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    const wrappedListener = (payload: unknown) => {
      listener(payload as ProviderEventMap[EventName]);
    };

    eventListeners.add(wrappedListener);
    this.listeners.set(eventName, eventListeners);

    return () => {
      eventListeners.delete(wrappedListener);
    };
  }
}
