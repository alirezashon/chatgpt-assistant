import type { WorkspaceContext } from '@/app/workspace/workspace-context';
import type { WorkspaceCommandMap, WorkspaceCommandName } from '@/app/workspace/workspace-types';

export class WorkspaceCommands {
  private readonly context: WorkspaceContext;

  public constructor(context: WorkspaceContext) {
    this.context = context;
  }

  public async execute<CommandName extends WorkspaceCommandName>(
    commandName: CommandName,
    payload: WorkspaceCommandMap[CommandName],
  ): Promise<void> {
    this.context.events.publish('commandExecuted', {
      commandName,
    });

    if (commandName === 'initializeWorkspace') {
      await this.initializeWorkspace();
      return;
    }

    if (commandName === 'reloadWorkspace') {
      await this.reloadWorkspace();
      return;
    }

    if (commandName === 'createFolder') {
      const input = payload as WorkspaceCommandMap['createFolder'];
      await this.context.folderService.createFolder(input);
      await this.refreshFolders();
      return;
    }

    if (commandName === 'updateFolder') {
      const input = payload as WorkspaceCommandMap['updateFolder'];
      await this.context.folderService.updateFolder(input);
      await this.refreshFolders();
      return;
    }

    if (commandName === 'deleteFolder') {
      const input = payload as WorkspaceCommandMap['deleteFolder'];
      await this.deleteFolder(input.folderId);
      return;
    }

    if (commandName === 'reorderFolders') {
      const input = payload as WorkspaceCommandMap['reorderFolders'];
      await this.context.folderService.reorderFolders(input);
      await this.refreshFolders();
      return;
    }

    if (commandName === 'refreshConversations') {
      this.refreshConversations();
      return;
    }

    if (commandName === 'refreshFolders') {
      await this.refreshFolders();
      return;
    }

    if (commandName === 'refreshAssignments') {
      await this.refreshAssignments();
      return;
    }

    if (commandName === 'assignConversationToFolder') {
      const input = payload as WorkspaceCommandMap['assignConversationToFolder'];
      await this.context.assignmentService.assign(input);
      await this.refreshAssignments();
      return;
    }

    if (commandName === 'removeConversationAssignment') {
      const input = payload as WorkspaceCommandMap['removeConversationAssignment'];
      await this.context.assignmentService.remove(input);
      await this.refreshAssignments();
      return;
    }

    if (commandName === 'selectFolder') {
      const input = payload as WorkspaceCommandMap['selectFolder'];
      await this.context.folderService.selectFolder({
        id: input.folderId,
      });
      await this.refreshFolders();
      return;
    }

    if (commandName === 'selectConversation') {
      const input = payload as WorkspaceCommandMap['selectConversation'];
      this.context.state.setState({
        activeConversationId: input.conversationId,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  private async initializeWorkspace(): Promise<void> {
    this.transitionTo('initializing');
    this.context.registry.registerSubsystem('storage', true);
    this.context.registry.registerSubsystem('assignments', false);
    this.context.registry.registerSubsystem('folders', false);
    this.context.registry.registerSubsystem('conversations', false);
    this.context.registry.registerSubsystem('sync', true);

    await this.context.folderService.initialize();
    this.context.registry.registerSubsystem('folders', true);

    await this.context.assignmentService.initialize();
    this.context.registry.registerSubsystem('assignments', true);

    this.context.conversationDetector.start();
    this.context.registry.registerSubsystem('conversations', true);

    await this.refreshFolders();
    await this.refreshAssignments();
    this.refreshConversations();
    this.transitionTo('ready');
    this.context.events.publish('engineReady', undefined);
  }

  private async reloadWorkspace(): Promise<void> {
    this.transitionTo('updating');
    await this.refreshFolders();
    await this.refreshAssignments();
    this.refreshConversations();
    this.transitionTo('ready');
    this.context.events.publish('workspaceReloaded', undefined);
  }

  private async deleteFolder(folderId: string): Promise<void> {
    const assignments = await this.context.assignmentService.findByFolder(folderId);

    await Promise.all(
      assignments.map((assignment) =>
        this.context.assignmentService.remove({
          conversationId: assignment.conversationId,
        }),
      ),
    );
    await this.context.folderService.deleteFolder(folderId);
    await this.refreshAssignments();
    await this.refreshFolders();
  }

  private refreshConversations(): void {
    this.context.conversationDetector.detect();
    const conversations = this.context.conversationRepository.getAll();
    this.context.registry.syncConversations(this.context.conversationRepository);
    this.context.state.setState({
      activeConversationId: this.context.conversationRepository.getActiveConversation()?.id ?? null,
      conversations: this.context.conversationService.getState(),
      updatedAt: new Date().toISOString(),
    });
    this.context.events.publish('conversationsRefreshed', {
      conversations,
    });
  }

  private async refreshFolders(): Promise<void> {
    const folders = await this.context.folderService.getFolders();
    this.context.registry.syncFolders(folders);
    this.context.state.setState({
      activeFolderId: this.context.state.getState().folders.selectedFolderId,
      folders: {
        ...this.context.state.getState().folders,
        folders,
      },
      updatedAt: new Date().toISOString(),
    });
    this.context.events.publish('foldersRefreshed', {
      folders,
    });
  }

  private async refreshAssignments(): Promise<void> {
    const assignments = await this.context.assignmentService.listAssignments();

    this.context.state.setState({
      assignments: {
        assignments,
        error: null,
        status: 'ready',
      },
      updatedAt: new Date().toISOString(),
    });
    this.context.events.publish('assignmentsRefreshed', {
      assignments,
    });
  }

  private transitionTo(
    nextStage: Parameters<WorkspaceContext['lifecycle']['transitionTo']>[0],
  ): void {
    const transition = this.context.lifecycle.transitionTo(nextStage);

    if (transition === null) {
      return;
    }

    this.context.state.setState({
      lifecycle: transition.nextStage,
      updatedAt: new Date().toISOString(),
    });
    this.context.events.publish('lifecycleChanged', transition);
  }
}
