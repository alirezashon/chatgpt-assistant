import type { ConversationAssignment } from '@/features/assignments/assignment-types';

export interface AssignmentEventMap {
  readonly assignmentCreated: {
    readonly assignment: ConversationAssignment;
  };
  readonly assignmentRemoved: {
    readonly assignment: ConversationAssignment;
  };
  readonly assignmentUpdated: {
    readonly assignment: ConversationAssignment;
  };
  readonly folderContentsChanged: {
    readonly folderId: string;
  };
}

export type AssignmentEventName = keyof AssignmentEventMap;
export type AssignmentEventListener<EventName extends AssignmentEventName> = (
  payload: AssignmentEventMap[EventName],
) => void;
export type AssignmentEventUnsubscribe = () => void;

export class AssignmentEvents {
  private readonly listeners = new Map<AssignmentEventName, Set<(payload: unknown) => void>>();

  public emit<EventName extends AssignmentEventName>(
    eventName: EventName,
    payload: AssignmentEventMap[EventName],
  ): void {
    const eventListeners = this.listeners.get(eventName);

    if (eventListeners === undefined) {
      return;
    }

    for (const listener of eventListeners) {
      listener(payload);
    }
  }

  public subscribe<EventName extends AssignmentEventName>(
    eventName: EventName,
    listener: AssignmentEventListener<EventName>,
  ): AssignmentEventUnsubscribe {
    const eventListeners = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    const wrappedListener = (payload: unknown) => {
      listener(payload as AssignmentEventMap[EventName]);
    };

    eventListeners.add(wrappedListener);
    this.listeners.set(eventName, eventListeners);

    return () => {
      eventListeners.delete(wrappedListener);
    };
  }
}
