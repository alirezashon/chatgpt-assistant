import { useCallback, useMemo, useState } from 'react';

import type { FolderFormValues } from '@/content/components/folders/FolderDialog';
import type { FolderDialogState } from '@/content/components/folders/folder-ui-types';
import { useToast } from '@/content/components/toast/use-toast';
import { createWorkspaceExplorerModel } from '@/content/components/workspace-explorer/workspace-explorer-selectors';
import type { ExplorerFilter } from '@/content/components/workspace-explorer/workspace-explorer-types';
import { getExplorerErrorMessage } from '@/content/components/workspace-explorer/workspace-explorer-utils';
import { useSyncActions, useSyncState } from '@/app/synchronization';
import { useWorkspaceActions, useWorkspaceState } from '@/app/workspace';
import { useActions } from '@/features/actions';
import { useFavorites } from '@/features/favorites';
import type { Folder } from '@/shared/types';

export function useWorkspaceExplorerController() {
  const workspaceState = useWorkspaceState();
  const workspaceActions = useWorkspaceActions();
  const syncState = useSyncState();
  const syncActions = useSyncActions();
  const quickActions = useActions();
  const favorites = useFavorites();
  const { notify } = useToast();
  const [filter, setFilter] = useState<ExplorerFilter>('all');
  const [dialogState, setDialogState] = useState<FolderDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const model = useMemo(
    () => createWorkspaceExplorerModel(workspaceState, filter, favorites.favoriteIds),
    [favorites.favoriteIds, filter, workspaceState],
  );

  const selectFilter = useCallback((nextFilter: ExplorerFilter) => {
    setFilter(nextFilter);
  }, []);

  const selectFolder = useCallback(
    async (folder: Folder) => {
      setOpenMenuId(null);
      setFilter('folder');

      try {
        await workspaceActions.execute('selectFolder', {
          folderId: folder.id,
        });
        syncActions.markRecentlyUsedFolder(folder.id);
      } catch (error) {
        notify(getExplorerErrorMessage(error), 'error');
      }
    },
    [notify, syncActions, workspaceActions],
  );

  const toggleExpanded = useCallback(
    (folderId: string) => {
      syncActions.toggleExpandedFolder(folderId);
    },
    [syncActions],
  );

  const dismissOnboarding = useCallback(() => {
    syncActions.updateUiPreferences({
      onboardingDismissed: true,
    });
  }, [syncActions]);

  const toggleMenu = useCallback((folderId: string) => {
    setOpenMenuId((currentFolderId) => (currentFolderId === folderId ? null : folderId));
  }, []);

  const openCreateDialog = useCallback(() => {
    setFormError(null);
    setOpenMenuId(null);
    setDialogState({
      mode: 'create',
    });
  }, []);

  const openRenameDialog = useCallback((folder: Folder) => {
    setFormError(null);
    setOpenMenuId(null);
    setDialogState({
      folder,
      mode: 'rename',
    });
  }, []);

  const openDeleteDialog = useCallback((folder: Folder) => {
    setDeleteError(null);
    setOpenMenuId(null);
    setDeleteTarget(folder);
  }, []);

  const closeFolderDialog = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setDialogState(null);
    setFormError(null);
  }, [isSubmitting]);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setDeleteTarget(null);
    setDeleteError(null);
  }, [isSubmitting]);

  const submitFolderDialog = useCallback(
    async (values: FolderFormValues) => {
      if (dialogState === null) {
        return;
      }

      setIsSubmitting(true);
      setFormError(null);

      try {
        if (dialogState.mode === 'create') {
          await workspaceActions.execute('createFolder', values);
          notify('Folder created.');
        } else if (dialogState.folder !== undefined) {
          await workspaceActions.execute('updateFolder', {
            ...values,
            id: dialogState.folder.id,
          });
          notify('Folder updated.');
        }

        setDialogState(null);
      } catch (error) {
        const message = getExplorerErrorMessage(error);

        setFormError(message);
        notify(message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [dialogState, notify, workspaceActions],
  );

  const confirmDeleteFolder = useCallback(async () => {
    if (deleteTarget === null) {
      return;
    }

    setIsSubmitting(true);
    setDeleteError(null);

    try {
      await workspaceActions.execute('deleteFolder', {
        folderId: deleteTarget.id,
      });
      setDeleteTarget(null);
      notify('Folder deleted.');
    } catch (error) {
      const message = getExplorerErrorMessage(error);

      setDeleteError(message);
      notify(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTarget, notify, workspaceActions]);

  const moveFolder = useCallback(
    async (folder: Folder, direction: 'down' | 'up') => {
      const orderedFolderIds = workspaceState.folders.folders.map((candidate) => candidate.id);
      const currentIndex = orderedFolderIds.indexOf(folder.id);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedFolderIds.length) {
        return;
      }

      const nextFolderIds = [...orderedFolderIds];
      const currentFolderId = nextFolderIds[currentIndex];
      const targetFolderId = nextFolderIds[nextIndex];

      if (currentFolderId === undefined || targetFolderId === undefined) {
        return;
      }

      nextFolderIds[currentIndex] = targetFolderId;
      nextFolderIds[nextIndex] = currentFolderId;
      setOpenMenuId(null);

      try {
        await workspaceActions.execute('reorderFolders', {
          orderedFolderIds: nextFolderIds,
        });
        notify('Folder order updated.');
      } catch (error) {
        notify(getExplorerErrorMessage(error), 'error');
      }
    },
    [notify, workspaceActions, workspaceState.folders.folders],
  );

  const assignActiveConversation = useCallback(
    async (folderId: string) => {
      if (model.activeConversation === null) {
        return;
      }

      try {
        await workspaceActions.execute('assignConversationToFolder', {
          conversationId: model.activeConversation.id,
          folderId,
        });
        syncActions.markRecentlyUsedFolder(folderId);
        notify('Conversation moved to folder.');
      } catch (error) {
        notify(getExplorerErrorMessage(error), 'error');
      }
    },
    [model.activeConversation, notify, syncActions, workspaceActions],
  );

  const removeActiveConversationAssignment = useCallback(async () => {
    if (model.activeConversation === null) {
      return;
    }

    try {
      await workspaceActions.execute('removeConversationAssignment', {
        conversationId: model.activeConversation.id,
      });
      notify('Conversation removed from folder.');
    } catch (error) {
      notify(getExplorerErrorMessage(error), 'error');
    }
  }, [model.activeConversation, notify, workspaceActions]);

  return {
    assignActiveConversation,
    quickActions,
    closeDeleteDialog,
    closeFolderDialog,
    confirmDeleteFolder,
    deleteError,
    deleteTarget,
    dismissOnboarding,
    dialogState,
    filter,
    formError,
    isLoading: workspaceState.lifecycle === 'boot' || workspaceState.lifecycle === 'initializing',
    isSubmitting,
    model,
    moveFolder,
    openCreateDialog,
    openDeleteDialog,
    openMenuId,
    openRenameDialog,
    removeActiveConversationAssignment,
    selectFilter,
    selectFolder,
    submitFolderDialog,
    syncError: syncState.error,
    toggleExpanded,
    toggleMenu,
    uiPreferences: syncState.uiPreferences,
    workspaceError: workspaceState.error,
    workspaceState,
  };
}
