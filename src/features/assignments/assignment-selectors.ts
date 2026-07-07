import type {
  AssignmentState,
  ConversationAssignment,
} from '@/features/assignments/assignment-types';

export function selectAssignmentByConversation(
  state: AssignmentState,
  conversationId: string,
): ConversationAssignment | null {
  return (
    state.assignments.find((assignment) => assignment.conversationId === conversationId) ?? null
  );
}

export function selectAssignmentsByFolder(
  state: AssignmentState,
  folderId: string,
): readonly ConversationAssignment[] {
  return state.assignments.filter((assignment) => assignment.folderId === folderId);
}

export function countAssignmentsByFolder(state: AssignmentState): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  for (const assignment of state.assignments) {
    counts.set(assignment.folderId, (counts.get(assignment.folderId) ?? 0) + 1);
  }

  return counts;
}
