import type { ActionDefinition, ActionExecutionOutcome } from '@/features/actions/action-types';

export interface ActionEventMap {
  readonly actionCompleted: {
    readonly action: ActionDefinition;
    readonly outcome: ActionExecutionOutcome;
  };
  readonly actionFailed: {
    readonly action: ActionDefinition;
    readonly error: Error;
  };
  readonly actionStarted: {
    readonly action: ActionDefinition;
  };
}

export type ActionEventName = keyof ActionEventMap;
export type ActionEventListener<EventName extends ActionEventName> = (
  payload: ActionEventMap[EventName],
) => void;
export type ActionEventUnsubscribe = () => void;

export class ActionEvents {
  private readonly listeners = new Map<ActionEventName, Set<(payload: unknown) => void>>();

  public emit<EventName extends ActionEventName>(
    eventName: EventName,
    payload: ActionEventMap[EventName],
  ): void {
    const listeners = this.listeners.get(eventName);

    if (listeners === undefined) {
      return;
    }

    for (const listener of listeners) {
      listener(payload);
    }
  }

  public subscribe<EventName extends ActionEventName>(
    eventName: EventName,
    listener: ActionEventListener<EventName>,
  ): ActionEventUnsubscribe {
    const listeners = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    const wrappedListener = (payload: unknown) => {
      listener(payload as ActionEventMap[EventName]);
    };

    listeners.add(wrappedListener);
    this.listeners.set(eventName, listeners);

    return () => {
      listeners.delete(wrappedListener);
    };
  }
}
