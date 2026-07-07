import { useCallback, useEffect, useMemo, useState } from 'react';

import type { FolderFormValues } from '@/content/components/folders/FolderDialog';
import {
  assignConversationToFolder,
  getFolderErrorMessage,
  getReorderedFolderIds,
  groupConversationsByFolder,
  removeConversationAssignment,
} from '@/content/components/folders/folder-sidebar-utils';
import type { FolderDialogState } from '@/content/components/folders/folder-ui-types';
import { useToast } from '@/content/components/toast/use-toast';
import { useSyncActions, useUiPreferences } from '@/app/synchronization';
import { selectAssignmentByConversation, useAssignments } from '@/features/assignments';
import { selectActiveConversation, useConversationState } from '@/features/conversations';
import { useFolders } from '@/features/folders';
import type { Folder } from '@/shared/types';

export function useFolderSidebarController() {
  const { actions, error, folders, selectedFolderId, status } = useFolders();
  const assignments = useAssignments();
  const conversationState = useConversationState();
  const { notify } = useToast();
  const syncActions = useSyncActions();
  const uiPreferences = useUiPreferences();
  const [dialogState, setDialogState] = useState<FolderDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderedFolderIds = useMemo(() => folders.map((folder) => folder.id), [folders]);
  const expandedFolderIds = useMemo(
    () => new Set(uiPreferences.expandedFolderIds),
    [uiPreferences.expandedFolderIds],
  );
  const activeConversation = selectActiveConversation(conversationState);
  const activeAssignment =
    activeConversation === null
      ? null
      : selectAssignmentByConversation(assignments, activeConversation.id);
  const conversationsByFolderId = useMemo(
    () => groupConversationsByFolder(assignments.assignments, conversationState.conversations),
    [assignments.assignments, conversationState.conversations],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
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

  const toggleMenu = useCallback((folderId: string) => {
    setOpenMenuId((currentFolderId) => (currentFolderId === folderId ? null : folderId));
  }, []);

  const selectFolder = useCallback(
    async (folder: Folder) => {
      setOpenMenuId(null);

      try {
        await actions.selectFolder({
          id: folder.id,
        });
        syncActions.markRecentlyUsedFolder(folder.id);
      } catch (selectionError) {
        notify(getFolderErrorMessage(selectionError), 'error');
      }
    },
    [actions, notify, syncActions],
  );

  const toggleExpanded = useCallback(
    (folderId: string) => {
      syncActions.toggleExpandedFolder(folderId);
    },
    [syncActions],
  );

  const moveFolder = useCallback(
    async (folder: Folder, direction: 'down' | 'up') => {
      const nextFolderIds = getReorderedFolderIds(orderedFolderIds, folder.id, direction);

      if (nextFolderIds === null) {
        return;
      }

      setOpenMenuId(null);

      try {
        await actions.reorderFolders({
          orderedFolderIds: nextFolderIds,
        });
        notify('Folder order updated.');
      } catch (reorderError) {
        notify(getFolderErrorMessage(reorderError), 'error');
      }
    },
    [actions, notify, orderedFolderIds],
  );

  const assignActiveConversation = useCallback(
    async (folderId: string) => {
      if (activeConversation === null) {
        return;
      }

      const assigned = await assignConversationToFolder(
        activeConversation.id,
        folderId,
        assignments.actions,
        notify,
      );

      if (assigned) {
        syncActions.markRecentlyUsedFolder(folderId);
      }
    },
    [activeConversation, assignments.actions, notify, syncActions],
  );

  const removeActiveConversationAssignment = useCallback(async () => {
    if (activeConversation === null) {
      return;
    }

    await removeConversationAssignment(activeConversation.id, assignments.actions, notify);
  }, [activeConversation, assignments.actions, notify]);

  const submitFolderDialog = useCallback(
    async (values: FolderFormValues) => {
      if (dialogState === null) {
        return;
      }

      setIsSubmitting(true);
      setFormError(null);

      try {
        if (dialogState.mode === 'create') {
          await actions.createFolder(values);
          notify('Folder created.');
        } else if (dialogState.folder !== undefined) {
          await actions.updateFolder({
            ...values,
            id: dialogState.folder.id,
          });
          notify('Folder updated.');
        }

        setDialogState(null);
      } catch (submitError) {
        const message = getFolderErrorMessage(submitError);

        setFormError(message);
        notify(message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [actions, dialogState, notify],
  );

  const confirmDeleteFolder = useCallback(async () => {
    if (deleteTarget === null) {
      return;
    }

    setIsSubmitting(true);
    setDeleteError(null);

    try {
      await actions.deleteFolder(deleteTarget.id);
      setDeleteTarget(null);
      notify('Folder deleted.');
    } catch (deleteFolderError) {
      const message = getFolderErrorMessage(deleteFolderError);

      setDeleteError(message);
      notify(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [actions, deleteTarget, notify]);

  return {
    activeAssignment,
    activeConversation,
    assignActiveConversation,
    closeDeleteDialog,
    closeFolderDialog,
    confirmDeleteFolder,
    conversationsByFolderId,
    deleteError,
    deleteTarget,
    dialogState,
    error,
    expandedFolderIds,
    folders,
    formError,
    isAssignmentSaving: assignments.status === 'saving',
    isSubmitting,
    moveFolder,
    openCreateDialog,
    openDeleteDialog,
    openMenuId,
    openRenameDialog,
    removeActiveConversationAssignment,
    selectFolder,
    selectedFolderId,
    status,
    submitFolderDialog,
    toggleExpanded,
    toggleMenu,
  };
}
