import type { FolderState } from '@/features/folders/folder-types';
import { createStore } from '@/state';

export const initialFolderState: FolderState = {
  error: null,
  folders: [],
  selectedFolderId: null,
  status: 'idle',
};

export const folderStore = createStore<FolderState>(initialFolderState);
