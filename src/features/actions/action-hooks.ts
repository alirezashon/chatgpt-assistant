import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import type { ActionEngine } from '@/features/actions/action-engine';
import { getActionEngine } from '@/features/actions/action-initializer';
import { actionStore } from '@/features/actions/action-state';
import type { ActionDefinition, ActionState } from '@/features/actions/action-types';
import type { EntityId } from '@/shared/types';

export interface ActionActions {
  readonly clearSelection: () => void;
  readonly closeFolderPicker: () => void;
  readonly closeMenu: () => void;
  readonly closeRename: () => void;
  readonly execute: (actionId: string, targetIds: readonly EntityId[]) => Promise<void>;
  readonly getActions: (targetIds: readonly EntityId[]) => readonly ActionDefinition[];
  readonly moveTargetsToFolder: (folderId: EntityId) => Promise<void>;
  readonly openMenu: (input: {
    readonly targetIds: readonly EntityId[];
    readonly x: number;
    readonly y: number;
  }) => void;
  readonly setFolderPickerQuery: (query: string) => void;
  readonly setSelectedConversationIds: (conversationIds: readonly EntityId[]) => void;
  readonly renameConversation: (conversationId: EntityId, title: string) => void;
  readonly toggleSelection: (conversationId: EntityId) => void;
}

export interface UseActionsResult extends ActionState {
  readonly actions: ActionActions;
}

export function useActionState(): ActionState {
  return useSyncExternalStore(
    (listener) => actionStore.subscribe(listener),
    () => actionStore.getState(),
    () => actionStore.getState(),
  );
}

export function useActionActions(engine: ActionEngine = getActionEngine()): ActionActions {
  const execute = useCallback(
    async (actionId: string, targetIds: readonly EntityId[]) => {
      await engine.execute(actionId, targetIds);
    },
    [engine],
  );
  const openMenu = useCallback(
    (input: {
      readonly targetIds: readonly EntityId[];
      readonly x: number;
      readonly y: number;
    }) => {
      engine.openMenu(input);
    },
    [engine],
  );
  const closeMenu = useCallback(() => {
    engine.closeMenu();
  }, [engine]);
  const closeRename = useCallback(() => {
    engine.closeRename();
  }, [engine]);
  const toggleSelection = useCallback(
    (conversationId: EntityId) => {
      engine.toggleSelection(conversationId);
    },
    [engine],
  );
  const setSelectedConversationIds = useCallback(
    (conversationIds: readonly EntityId[]) => {
      engine.setSelectedConversationIds(conversationIds);
    },
    [engine],
  );
  const clearSelection = useCallback(() => {
    engine.clearSelection();
  }, [engine]);
  const getActions = useCallback(
    (targetIds: readonly EntityId[]) => engine.getActions(targetIds),
    [engine],
  );
  const moveTargetsToFolder = useCallback(
    async (folderId: EntityId) => {
      await engine.moveTargetsToFolder(folderId);
    },
    [engine],
  );
  const closeFolderPicker = useCallback(() => {
    engine.closeFolderPicker();
  }, [engine]);
  const setFolderPickerQuery = useCallback(
    (query: string) => {
      engine.setFolderPickerQuery(query);
    },
    [engine],
  );
  const renameConversation = useCallback(
    (conversationId: EntityId, title: string) => {
      engine.renameConversation(conversationId, title);
    },
    [engine],
  );

  return useMemo(
    () => ({
      clearSelection,
      closeFolderPicker,
      closeMenu,
      closeRename,
      execute,
      getActions,
      moveTargetsToFolder,
      openMenu,
      renameConversation,
      setFolderPickerQuery,
      setSelectedConversationIds,
      toggleSelection,
    }),
    [
      clearSelection,
      closeFolderPicker,
      closeMenu,
      closeRename,
      execute,
      getActions,
      moveTargetsToFolder,
      openMenu,
      renameConversation,
      setFolderPickerQuery,
      setSelectedConversationIds,
      toggleSelection,
    ],
  );
}

export function useActions(engine: ActionEngine = getActionEngine()): UseActionsResult {
  const state = useActionState();
  const actions = useActionActions(engine);

  useEffect(() => {
    void engine.initialize();
  }, [engine]);

  return {
    ...state,
    actions,
  };
}
