import type { WorkspaceContext } from '@/app/workspace/workspace-context';
import { createRuntimeStatePatch, toWorkspaceError } from '@/app/workspace/workspace-utils';
import { assignmentStore } from '@/features/assignments';
import { conversationStore } from '@/features/conversations';
import { folderStore } from '@/features/folders';
import type { Unsubscribe } from '@/state';

export class WorkspaceManager {
  private readonly context: WorkspaceContext;
  private readonly unsubscribers: Unsubscribe[] = [];

  public constructor(context: WorkspaceContext) {
    this.context = context;
  }

  public start(): void {
    this.stop();
    this.unsubscribers.push(
      assignmentStore.subscribe(() => {
        this.syncSubsystemState();
      }),
      conversationStore.subscribe(() => {
        this.syncSubsystemState();
      }),
      folderStore.subscribe(() => {
        this.syncSubsystemState();
      }),
    );
  }

  public stop(): void {
    while (this.unsubscribers.length > 0) {
      this.unsubscribers.pop()?.();
    }
  }

  public captureError(error: unknown): void {
    const workspaceError = toWorkspaceError(error);

    this.context.state.setState({
      error: workspaceError,
      lifecycle: 'idle',
      updatedAt: new Date().toISOString(),
    });
    this.context.events.publish('errorCaptured', {
      error: workspaceError,
    });
    this.context.logger.error('Workspace engine captured an error.', workspaceError);
  }

  private syncSubsystemState(): void {
    this.context.state.setState(createRuntimeStatePatch());
    this.context.events.publish('engineUpdated', undefined);
  }
}
