import type { Folder } from '@/shared/types';

export type FolderDialogMode = 'create' | 'rename';
export type FolderIconName = 'bookmark' | 'briefcase' | 'folder';

export interface FolderDialogState {
  readonly folder?: Folder;
  readonly mode: FolderDialogMode;
}
