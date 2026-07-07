import { getWorkspaceEngine } from '@/app/workspace';
import { workspaceStore } from '@/app/workspace/workspace-state';
import { conversationStore } from '@/features/conversations';
import { DEFAULT_ACTION_CONFIG, type ActionConfig } from '@/features/actions/action-config';
import { ActionEvents } from '@/features/actions/action-events';
import { ActionExecutor } from '@/features/actions/action-executor';
import { ActionHistory } from '@/features/actions/action-history';
import { ActionQueue } from '@/features/actions/action-queue';
import { ActionRegistry } from '@/features/actions/action-registry';
import { actionStore } from '@/features/actions/action-state';
import type {
  ActionDefinition,
  ActionProvider,
  ActionState,
} from '@/features/actions/action-types';
import { DEFAULT_ACTION_PROVIDERS } from '@/features/actions/default-action-providers';
import { getFavoriteService, type FavoriteService } from '@/features/favorites';
import type { EntityId } from '@/shared/types';
import type { Store } from '@/state';

interface OpenMenuInput {
  readonly targetIds: readonly EntityId[];
  readonly x: number;
  readonly y: number;
}

interface ActionEngineOptions {
  readonly config?: ActionConfig;
  readonly favoriteService?: FavoriteService;
  readonly providers?: readonly ActionProvider[];
  readonly store?: Store<ActionState>;
}

export class ActionEngine {
  private readonly executor: ActionExecutor;
  private readonly favoriteService: FavoriteService;
  private readonly queue = new ActionQueue();
  private readonly registry = new ActionRegistry();
  private readonly store: Store<ActionState>;

  public constructor(options: ActionEngineOptions = {}) {
    const config = options.config ?? DEFAULT_ACTION_CONFIG;
    const events = new ActionEvents();
    const history = new ActionHistory(config);

    this.executor = new ActionExecutor(events, history);
    this.favoriteService = options.favoriteService ?? getFavoriteService();
    this.store = options.store ?? actionStore;

    for (const provider of options.providers ?? DEFAULT_ACTION_PROVIDERS) {
      this.registry.registerProvider(provider);
    }
  }

  public async initialize(): Promise<void> {
    await this.favoriteService.initialize();
  }

  public getActions(targetIds: readonly EntityId[]): readonly ActionDefinition[] {
    return this.registry.getActions(this.createContext(targetIds));
  }

  public registerProvider(provider: ActionProvider): void {
    this.registry.registerProvider(provider);
  }

  public openMenu(input: OpenMenuInput): void {
    this.store.setState({
      menu: {
        open: true,
        targetIds: input.targetIds,
        x: input.x,
        y: input.y,
      },
    });
  }

  public closeMenu(): void {
    this.store.setState({
      menu: {
        open: false,
        targetIds: [],
        x: 0,
        y: 0,
      },
    });
  }

  public setSelectedConversationIds(conversationIds: readonly EntityId[]): void {
    this.store.setState({
      selectedConversationIds: [...new Set(conversationIds)],
    });
  }

  public clearSelection(): void {
    this.setSelectedConversationIds([]);
  }

  public toggleSelection(conversationId: EntityId): void {
    const selectedConversationIds = new Set(this.store.getState().selectedConversationIds);

    if (selectedConversationIds.has(conversationId)) {
      selectedConversationIds.delete(conversationId);
    } else {
      selectedConversationIds.add(conversationId);
    }

    this.setSelectedConversationIds([...selectedConversationIds]);
  }

  public async execute(actionId: string, targetIds: readonly EntityId[]): Promise<void> {
    await this.initialize();
    const context = this.createContext(targetIds);
    const action = this.registry.findAction(actionId, context);

    if (action === null) {
      throw new Error(`Action not found: ${actionId}`);
    }

    this.store.setState({
      error: null,
      status: 'running',
    });

    await new Promise<void>((resolve, reject) => {
      this.queue.enqueue(async () => {
        try {
          const result = await this.executor.execute(action, context);

          this.handleOutcome(action.id, targetIds, result.outcome.type);
          this.store.setState({
            error: null,
            history: result.history,
            status: 'idle',
          });
          resolve();
        } catch (error) {
          const actionError = error instanceof Error ? error : new Error('Action failed.');

          this.store.setState({
            error: actionError,
            status: 'error',
          });
          reject(actionError);
        }
      });
    });
  }

  public async moveTargetsToFolder(folderId: EntityId): Promise<void> {
    const targetIds = this.store.getState().folderPicker.targetIds;

    await Promise.all(
      targetIds.map((conversationId) =>
        getWorkspaceEngine().execute('assignConversationToFolder', {
          conversationId,
          folderId,
        }),
      ),
    );
    this.store.setState({
      folderPicker: {
        open: false,
        query: '',
        targetIds: [],
      },
    });
  }

  public closeFolderPicker(): void {
    this.store.setState({
      folderPicker: {
        open: false,
        query: '',
        targetIds: [],
      },
    });
  }

  public setFolderPickerQuery(query: string): void {
    this.store.setState((currentState) => ({
      folderPicker: {
        ...currentState.folderPicker,
        query,
      },
    }));
  }

  public renameConversation(conversationId: EntityId, title: string): void {
    const normalizedTitle = title.trim().replace(/\s+/gu, ' ');

    if (normalizedTitle.length === 0) {
      throw new Error('Conversation title is required.');
    }

    if (normalizedTitle.length > 120) {
      throw new Error('Conversation title must be 120 characters or fewer.');
    }

    const now = new Date().toISOString();

    conversationStore.setState((currentState) => ({
      conversations: currentState.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: normalizedTitle,
              updatedAt: now,
            }
          : conversation,
      ),
    }));
    workspaceStore.setState((currentState) => ({
      conversations: {
        ...currentState.conversations,
        conversations: currentState.conversations.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                title: normalizedTitle,
                updatedAt: now,
              }
            : conversation,
        ),
      },
      updatedAt: now,
    }));
    this.store.setState({
      rename: {
        conversationId: null,
        open: false,
      },
    });
  }

  public closeRename(): void {
    this.store.setState({
      rename: {
        conversationId: null,
        open: false,
      },
    });
  }

  private handleOutcome(
    actionId: string,
    targetIds: readonly EntityId[],
    outcomeType: string,
  ): void {
    if (actionId === 'select-all') {
      this.setSelectedConversationIds(
        workspaceStore
          .getState()
          .conversations.conversations.map((conversation) => conversation.id),
      );
      this.closeMenu();
      return;
    }

    if (actionId === 'deselect-all') {
      this.clearSelection();
      this.closeMenu();
      return;
    }

    if (outcomeType === 'folderPickerRequested') {
      this.store.setState({
        folderPicker: {
          open: true,
          query: '',
          targetIds,
        },
      });
      this.closeMenu();
      return;
    }

    if (outcomeType === 'renameRequested') {
      this.store.setState({
        rename: {
          conversationId: targetIds[0] ?? null,
          open: targetIds.length === 1,
        },
      });
      this.closeMenu();
      return;
    }

    this.closeMenu();
  }

  private createContext(targetIds: readonly EntityId[]) {
    return {
      favoriteService: this.favoriteService,
      targetIds,
      workspace: workspaceStore.getState(),
    };
  }
}
