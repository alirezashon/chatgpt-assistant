import type {
  WorkspaceCommandName,
  WorkspaceLifecycleStage,
} from '@/app/workspace/workspace-types';
import type { ConversationAssignment } from '@/features/assignments';
import type { Conversation } from '@/features/conversations';
import type { Folder } from '@/shared/types';

export interface WorkspaceEventMetadata {
  readonly id: string;
  readonly timestamp: string;
}

export interface WorkspaceEventEnvelope<EventName extends WorkspaceEventName = WorkspaceEventName> {
  readonly metadata: WorkspaceEventMetadata;
  readonly name: EventName;
  readonly payload: WorkspaceEventMap[EventName];
}

export interface WorkspaceEventMap {
  readonly assignmentsRefreshed: {
    readonly assignments: readonly ConversationAssignment[];
  };
  readonly commandExecuted: {
    readonly commandName: WorkspaceCommandName;
  };
  readonly conversationsRefreshed: {
    readonly conversations: readonly Conversation[];
  };
  readonly engineDestroyed: undefined;
  readonly engineReady: undefined;
  readonly engineStarted: undefined;
  readonly engineUpdated: undefined;
  readonly errorCaptured: {
    readonly error: Error;
  };
  readonly foldersRefreshed: {
    readonly folders: readonly Folder[];
  };
  readonly lifecycleChanged: {
    readonly nextStage: WorkspaceLifecycleStage;
    readonly previousStage: WorkspaceLifecycleStage;
  };
  readonly workspaceReloaded: undefined;
}

export type WorkspaceEventName = keyof WorkspaceEventMap;
export type WorkspaceEventListener<EventName extends WorkspaceEventName> = (
  envelope: WorkspaceEventEnvelope<EventName>,
) => void;
export type WorkspaceEventUnsubscribe = () => void;

export interface WorkspaceEventSubscriptionOptions {
  readonly once?: boolean;
  readonly priority?: number;
}

interface WorkspaceEventSubscription {
  readonly id: string;
  readonly listener: (envelope: WorkspaceEventEnvelope) => void;
  readonly originalListener: unknown;
  readonly once: boolean;
  readonly priority: number;
}

export class WorkspaceEvents {
  private readonly historyLimit: number;
  private readonly history: WorkspaceEventEnvelope[] = [];
  private readonly subscriptions = new Map<
    WorkspaceEventName,
    Map<string, WorkspaceEventSubscription>
  >();

  public constructor(historyLimit: number) {
    this.historyLimit = historyLimit;
  }

  public getHistory(): readonly WorkspaceEventEnvelope[] {
    return this.history;
  }

  public publish<EventName extends WorkspaceEventName>(
    eventName: EventName,
    payload: WorkspaceEventMap[EventName],
  ): void {
    const envelope: WorkspaceEventEnvelope<EventName> = {
      metadata: {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      name: eventName,
      payload,
    };

    this.pushHistory(envelope);

    const subscriptions = this.subscriptions.get(eventName);

    if (subscriptions === undefined) {
      return;
    }

    const orderedSubscriptions = Array.from(subscriptions.values()).sort(
      (firstSubscription, secondSubscription) =>
        secondSubscription.priority - firstSubscription.priority,
    );

    for (const subscription of orderedSubscriptions) {
      subscription.listener(envelope);

      if (subscription.once) {
        subscriptions.delete(subscription.id);
      }
    }
  }

  public subscribe<EventName extends WorkspaceEventName>(
    eventName: EventName,
    listener: WorkspaceEventListener<EventName>,
    options: WorkspaceEventSubscriptionOptions = {},
  ): WorkspaceEventUnsubscribe {
    const subscriptions =
      this.subscriptions.get(eventName) ?? new Map<string, WorkspaceEventSubscription>();
    const existingSubscription = Array.from(subscriptions.values()).find(
      (subscription) => subscription.originalListener === listener,
    );

    if (existingSubscription !== undefined) {
      return () => {
        subscriptions.delete(existingSubscription.id);
      };
    }

    const id = crypto.randomUUID();
    const wrappedListener = (envelope: WorkspaceEventEnvelope) => {
      listener(envelope as WorkspaceEventEnvelope<EventName>);
    };

    subscriptions.set(id, {
      id,
      listener: wrappedListener,
      originalListener: listener,
      once: options.once ?? false,
      priority: options.priority ?? 0,
    });
    this.subscriptions.set(eventName, subscriptions);

    return () => {
      subscriptions.delete(id);
    };
  }

  public once<EventName extends WorkspaceEventName>(
    eventName: EventName,
    listener: WorkspaceEventListener<EventName>,
    options: Omit<WorkspaceEventSubscriptionOptions, 'once'> = {},
  ): WorkspaceEventUnsubscribe {
    return this.subscribe(eventName, listener, {
      ...options,
      once: true,
    });
  }

  public clear(): void {
    this.subscriptions.clear();
    this.history.length = 0;
  }

  private pushHistory(envelope: WorkspaceEventEnvelope): void {
    this.history.push(envelope);

    if (this.history.length > this.historyLimit) {
      this.history.splice(0, this.history.length - this.historyLimit);
    }
  }
}
