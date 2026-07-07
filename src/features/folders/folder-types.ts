import type { EntityId, Folder } from '@/shared/types';

export type FolderStatus = 'error' | 'idle' | 'loading' | 'ready' | 'saving';

export interface FolderState {
  readonly error: Error | null;
  readonly folders: readonly Folder[];
  readonly selectedFolderId: EntityId | null;
  readonly status: FolderStatus;
}

export interface CreateFolderInput {
  readonly color?: string;
  readonly icon?: string;
  readonly name: string;
}

export interface RenameFolderInput {
  readonly id: EntityId;
  readonly name: string;
}

export interface UpdateFolderInput {
  readonly color?: string;
  readonly icon?: string;
  readonly id: EntityId;
  readonly name?: string;
  readonly order?: number;
}

export interface ReorderFoldersInput {
  readonly orderedFolderIds: readonly EntityId[];
}

export interface SelectFolderInput {
  readonly id: EntityId | null;
}

export type FolderValidationCode =
  | 'DUPLICATE_FOLDER_NAME'
  | 'EMPTY_FOLDER_NAME'
  | 'FOLDER_NOT_FOUND'
  | 'INVALID_FOLDER_NAME_CHARACTERS'
  | 'INVALID_FOLDER_ORDER'
  | 'MAX_FOLDER_NAME_LENGTH_EXCEEDED';

export interface FolderValidationIssue {
  readonly code: FolderValidationCode;
  readonly message: string;
}

export interface FolderValidationResult {
  readonly issues: readonly FolderValidationIssue[];
  readonly valid: boolean;
}
