import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import {
  getAssignmentService,
  type AssignmentService,
} from '@/features/assignments/assignment-service';
import { assignmentStore } from '@/features/assignments/assignment-store';
import type {
  AssignConversationInput,
  AssignmentState,
  MoveConversationInput,
  RemoveAssignmentInput,
} from '@/features/assignments/assignment-types';

export interface AssignmentActions {
  readonly assign: (input: AssignConversationInput) => Promise<void>;
  readonly move: (input: MoveConversationInput) => Promise<void>;
  readonly refreshAssignments: () => Promise<void>;
  readonly remove: (input: RemoveAssignmentInput) => Promise<void>;
}

export interface UseAssignmentsResult extends AssignmentState {
  readonly actions: AssignmentActions;
}

export function useAssignmentState(): AssignmentState {
  return useSyncExternalStore(
    (listener) => assignmentStore.subscribe(listener),
    () => assignmentStore.getState(),
    () => assignmentStore.getState(),
  );
}

export function useAssignmentActions(
  service: AssignmentService = getAssignmentService(),
): AssignmentActions {
  const assign = useCallback(
    async (input: AssignConversationInput) => {
      await service.assign(input);
    },
    [service],
  );

  const move = useCallback(
    async (input: MoveConversationInput) => {
      await service.move(input);
    },
    [service],
  );

  const remove = useCallback(
    async (input: RemoveAssignmentInput) => {
      await service.remove(input);
    },
    [service],
  );

  const refreshAssignments = useCallback(async () => {
    await service.listAssignments();
  }, [service]);

  return useMemo(
    () => ({
      assign,
      move,
      refreshAssignments,
      remove,
    }),
    [assign, move, refreshAssignments, remove],
  );
}

export function useAssignments(
  service: AssignmentService = getAssignmentService(),
): UseAssignmentsResult {
  const state = useAssignmentState();
  const actions = useAssignmentActions(service);

  useEffect(() => {
    void service.initialize();
  }, [service]);

  return {
    ...state,
    actions,
  };
}
