import type { AssignmentState } from '@/features/assignments';
import type { ConversationState } from '@/features/conversations';
import type { FolderState } from '@/features/folders';
import type { WorkspaceRuntimeState } from '@/app/workspace/workspace-types';

export type SyncStatus = 'error' | 'idle' | 'recovering' | 'restoring' | 'syncing';

export interface UiPreferences {
  readonly expandedFolderIds: readonly string[];
  readonly onboardingDismissed: boolean;
  readonly recentlyUsedFolderIds: readonly string[];
  readonly sidebarOpen: boolean;
}

export interface WorkspaceSnapshot {
  readonly assignments: AssignmentState;
  readonly conversations: ConversationState;
  readonly createdAt: string;
  readonly folders: FolderState;
  readonly id: string;
  readonly schemaVersion: number;
  readonly uiPreferences: UiPreferences;
  readonly workspace: WorkspaceRuntimeState;
}

export interface SyncState {
  readonly error: Error | null;
  readonly lastSnapshot: WorkspaceSnapshot | null;
  readonly lastSyncedAt: string | null;
  readonly snapshotHistory: readonly WorkspaceSnapshot[];
  readonly status: SyncStatus;
  readonly uiPreferences: UiPreferences;
}

export type ConflictSeverity = 'error' | 'warning';

export type ConflictCode =
  | 'CORRUPTED_SNAPSHOT'
  | 'DUPLICATE_ASSIGNMENT'
  | 'DUPLICATE_FOLDER'
  | 'MISSING_CONVERSATION_FOR_ASSIGNMENT'
  | 'MISSING_FOLDER_FOR_ASSIGNMENT';

export interface SyncConflict {
  readonly code: ConflictCode;
  readonly message: string;
  readonly severity: ConflictSeverity;
}

export interface ConflictResolution {
  readonly conflicts: readonly SyncConflict[];
  readonly recoveredSnapshot: WorkspaceSnapshot;
}

export interface SyncTask {
  readonly createdAt: string;
  readonly id: string;
  readonly run: () => Promise<void>;
}
