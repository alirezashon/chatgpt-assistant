import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { getFolderService, type FolderService } from '@/features/folders/folder-service';
import { folderStore } from '@/features/folders/folder-store';
import type {
  CreateFolderInput,
  FolderState,
  ReorderFoldersInput,
  RenameFolderInput,
  SelectFolderInput,
  UpdateFolderInput,
} from '@/features/folders/folder-types';
import type { EntityId } from '@/shared/types';

export interface FolderActions {
  readonly createFolder: (input: CreateFolderInput) => Promise<void>;
  readonly deleteFolder: (folderId: EntityId) => Promise<void>;
  readonly refreshFolders: () => Promise<void>;
  readonly renameFolder: (input: RenameFolderInput) => Promise<void>;
  readonly reorderFolders: (input: ReorderFoldersInput) => Promise<void>;
  readonly selectFolder: (input: SelectFolderInput) => Promise<void>;
  readonly updateFolder: (input: UpdateFolderInput) => Promise<void>;
}

export interface UseFoldersResult extends FolderState {
  readonly actions: FolderActions;
}

export function useFolderState(): FolderState {
  return useSyncExternalStore(
    (listener) => folderStore.subscribe(listener),
    () => folderStore.getState(),
    () => folderStore.getState(),
  );
}

export function useFolderActions(service: FolderService = getFolderService()): FolderActions {
  const createFolder = useCallback(
    async (input: CreateFolderInput) => {
      await service.createFolder(input);
    },
    [service],
  );

  const deleteFolder = useCallback(
    async (folderId: EntityId) => {
      await service.deleteFolder(folderId);
    },
    [service],
  );

  const refreshFolders = useCallback(async () => {
    await service.getFolders();
  }, [service]);

  const renameFolder = useCallback(
    async (input: RenameFolderInput) => {
      await service.renameFolder(input);
    },
    [service],
  );

  const reorderFolders = useCallback(
    async (input: ReorderFoldersInput) => {
      await service.reorderFolders(input);
    },
    [service],
  );

  const selectFolder = useCallback(
    async (input: SelectFolderInput) => {
      await service.selectFolder(input);
    },
    [service],
  );

  const updateFolder = useCallback(
    async (input: UpdateFolderInput) => {
      await service.updateFolder(input);
    },
    [service],
  );

  return useMemo(
    () => ({
      createFolder,
      deleteFolder,
      refreshFolders,
      renameFolder,
      reorderFolders,
      selectFolder,
      updateFolder,
    }),
    [
      createFolder,
      deleteFolder,
      refreshFolders,
      renameFolder,
      reorderFolders,
      selectFolder,
      updateFolder,
    ],
  );
}

export function useFolders(service: FolderService = getFolderService()): UseFoldersResult {
  const state = useFolderState();
  const actions = useFolderActions(service);

  useEffect(() => {
    void service.initialize();
  }, [service]);

  return {
    ...state,
    actions,
  };
}
