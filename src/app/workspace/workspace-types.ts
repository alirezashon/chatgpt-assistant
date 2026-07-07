import type { AssignmentState } from '@/features/assignments';
import type { ConversationState } from '@/features/conversations';
import type {
  CreateFolderInput,
  FolderState,
  ReorderFoldersInput,
  UpdateFolderInput,
} from '@/features/folders';
import type { EntityId, Workspace } from '@/shared/types';

export type WorkspaceLifecycleStage =
  'boot' | 'destroyed' | 'idle' | 'initializing' | 'ready' | 'syncing' | 'updating';

export type WorkspaceSubsystemName =
  | 'analytics'
  | 'ai'
  | 'assignments'
  | 'conversations'
  | 'folders'
  | 'notifications'
  | 'search'
  | 'settings'
  | 'storage'
  | 'sync';

export interface WorkspaceRuntimeState {
  readonly activeConversationId: EntityId | null;
  readonly activeFolderId: EntityId | null;
  readonly assignments: AssignmentState;
  readonly conversations: ConversationState;
  readonly error: Error | null;
  readonly folders: FolderState;
  readonly lifecycle: WorkspaceLifecycleStage;
  readonly updatedAt: string;
  readonly workspace: Workspace;
}

export interface WorkspaceSubsystem {
  readonly initialized: boolean;
  readonly name: WorkspaceSubsystemName;
}

export interface WorkspaceCommandMap {
  readonly initializeWorkspace: undefined;
  readonly createFolder: CreateFolderInput;
  readonly deleteFolder: {
    readonly folderId: EntityId;
  };
  readonly refreshConversations: undefined;
  readonly refreshFolders: undefined;
  readonly reloadWorkspace: undefined;
  readonly assignConversationToFolder: {
    readonly conversationId: EntityId;
    readonly folderId: EntityId;
  };
  readonly refreshAssignments: undefined;
  readonly removeConversationAssignment: {
    readonly conversationId: EntityId;
  };
  readonly reorderFolders: ReorderFoldersInput;
  readonly selectConversation: {
    readonly conversationId: EntityId | null;
  };
  readonly selectFolder: {
    readonly folderId: EntityId | null;
  };
  readonly updateFolder: UpdateFolderInput;
}

export type WorkspaceCommandName = keyof WorkspaceCommandMap;

export interface WorkspaceQueryMap {
  readonly getConversationById: {
    readonly conversationId: EntityId;
  };
  readonly getCurrentConversation: undefined;
  readonly getFolders: undefined;
  readonly getWorkspace: undefined;
}

export type WorkspaceQueryName = keyof WorkspaceQueryMap;
