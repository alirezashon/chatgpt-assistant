import { WorkspaceCommands } from '@/app/workspace/workspace-commands';
import type { WorkspaceContext } from '@/app/workspace/workspace-context';
import type {
  WorkspaceEventListener,
  WorkspaceEventName,
  WorkspaceEventSubscriptionOptions,
  WorkspaceEventUnsubscribe,
} from '@/app/workspace/workspace-events';
import { WorkspaceManager } from '@/app/workspace/workspace-manager';
import { WorkspaceQueries } from '@/app/workspace/workspace-queries';
import type { WorkspaceCommandMap, WorkspaceCommandName } from '@/app/workspace/workspace-types';
import { migrateStorage } from '@/storage';

export class WorkspaceEngine {
  public readonly commands: WorkspaceCommands;
  public readonly queries: WorkspaceQueries;
  private readonly context: WorkspaceContext;
  private readonly manager: WorkspaceManager;
  private started = false;

  public constructor(context: WorkspaceContext) {
    this.context = context;
    this.commands = new WorkspaceCommands(context);
    this.queries = new WorkspaceQueries(context);
    this.manager = new WorkspaceManager(context);
  }

  public async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    await migrateStorage(this.context.storage);
    this.context.events.publish('engineStarted', undefined);
    this.manager.start();

    try {
      await this.commands.execute('initializeWorkspace', undefined);
      await this.context.synchronizationEngine.start();
    } catch (error) {
      this.manager.captureError(error);
    }
  }

  public destroy(): void {
    this.context.conversationDetector.stop();
    this.context.synchronizationEngine.stop();
    this.manager.stop();
    this.context.lifecycle.transitionTo('destroyed');
    this.context.events.publish('engineDestroyed', undefined);
    this.context.events.clear();
    this.started = false;
  }

  public async execute<CommandName extends WorkspaceCommandName>(
    commandName: CommandName,
    payload: WorkspaceCommandMap[CommandName],
  ): Promise<void> {
    try {
      await this.commands.execute(commandName, payload);
    } catch (error) {
      this.manager.captureError(error);
      throw error;
    }
  }

  public subscribe<EventName extends WorkspaceEventName>(
    eventName: EventName,
    listener: WorkspaceEventListener<EventName>,
    options?: WorkspaceEventSubscriptionOptions,
  ): WorkspaceEventUnsubscribe {
    return this.context.events.subscribe(eventName, listener, options);
  }

  public once<EventName extends WorkspaceEventName>(
    eventName: EventName,
    listener: WorkspaceEventListener<EventName>,
    options?: Omit<WorkspaceEventSubscriptionOptions, 'once'>,
  ): WorkspaceEventUnsubscribe {
    return this.context.events.once(eventName, listener, options);
  }
}
