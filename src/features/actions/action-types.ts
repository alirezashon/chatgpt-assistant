import type { WorkspaceRuntimeState } from '@/app/workspace';
import type { ConversationAssignment } from '@/features/assignments';
import type { FavoriteService } from '@/features/favorites';
import type { Chat, EntityId, Folder } from '@/shared/types';

export type ActionScope = 'bulk' | 'conversation' | 'global';
export type ActionKind = 'danger' | 'normal' | 'separator';
export type ActionIcon =
  'copy' | 'external' | 'folder' | 'heart' | 'menu' | 'rename' | 'select' | 'sparkle' | 'trash';

export interface ActionTarget {
  readonly conversationId: EntityId;
}

export interface ActionContext {
  readonly favoriteService: FavoriteService;
  readonly targetIds: readonly EntityId[];
  readonly workspace: WorkspaceRuntimeState;
}

export interface ActionExecutionOutcome {
  readonly message?: string;
  readonly type:
    | 'completed'
    | 'exportRequested'
    | 'folderPickerRequested'
    | 'renameRequested'
    | 'selectionRequested';
}

export interface ActionDefinition {
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly icon: ActionIcon;
  readonly id: string;
  readonly kind: ActionKind;
  readonly label: string;
  readonly scope: ActionScope;
  readonly separatorBefore?: boolean;
  readonly shortcut?: string;
  execute(context: ActionContext): Promise<ActionExecutionOutcome>;
}

export interface ActionProvider {
  readonly id: string;
  getActions(context: ActionContext): readonly ActionDefinition[];
}

export interface ActionMenuState {
  readonly open: boolean;
  readonly targetIds: readonly EntityId[];
  readonly x: number;
  readonly y: number;
}

export interface FolderPickerState {
  readonly open: boolean;
  readonly query: string;
  readonly targetIds: readonly EntityId[];
}

export interface RenameState {
  readonly conversationId: EntityId | null;
  readonly open: boolean;
}

export interface ActionHistoryEntry {
  readonly actionId: string;
  readonly createdAt: string;
  readonly id: string;
  readonly recovery?: ActionRecoverySnapshot;
  readonly reversible: boolean;
  readonly targetIds: readonly EntityId[];
}

export interface ActionRecoverySnapshot {
  readonly actionId: string;
  readonly assignments: readonly ConversationAssignment[];
  readonly capturedAt: string;
  readonly conversations: readonly Chat[];
  readonly folders: readonly Folder[];
  readonly targetIds: readonly EntityId[];
}

export interface ActionState {
  readonly error: Error | null;
  readonly folderPicker: FolderPickerState;
  readonly history: readonly ActionHistoryEntry[];
  readonly menu: ActionMenuState;
  readonly rename: RenameState;
  readonly selectedConversationIds: readonly EntityId[];
  readonly status: 'error' | 'idle' | 'running';
}
