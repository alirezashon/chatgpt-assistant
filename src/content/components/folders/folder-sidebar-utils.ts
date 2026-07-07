import { AssignmentValidationError, type AssignmentActions } from '@/features/assignments';
import type { Conversation } from '@/features/conversations';
import { FolderValidationError } from '@/features/folders';

export type ToastNotifier = (message: string, tone?: 'error' | 'success') => void;

export function getFolderErrorMessage(error: unknown): string {
  if (error instanceof FolderValidationError) {
    return error.issues[0]?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Folder action failed.';
}

export async function assignConversationToFolder(
  conversationId: string,
  folderId: string,
  actions: AssignmentActions,
  notify: ToastNotifier,
): Promise<boolean> {
  try {
    await actions.assign({
      conversationId,
      folderId,
    });
    notify('Conversation moved to folder.');

    return true;
  } catch (error) {
    notify(getAssignmentErrorMessage(error), 'error');

    return false;
  }
}

export async function removeConversationAssignment(
  conversationId: string,
  actions: AssignmentActions,
  notify: ToastNotifier,
): Promise<void> {
  try {
    await actions.remove({
      conversationId,
    });
    notify('Conversation removed from folder.');
  } catch (error) {
    notify(getAssignmentErrorMessage(error), 'error');
  }
}

export function groupConversationsByFolder(
  assignments: readonly { readonly conversationId: string; readonly folderId: string }[],
  conversations: readonly Conversation[],
): ReadonlyMap<string, readonly Conversation[]> {
  const conversationById = new Map(
    conversations.map((conversation) => [conversation.id, conversation]),
  );
  const groups = new Map<string, Conversation[]>();

  for (const assignment of assignments) {
    const conversation = conversationById.get(assignment.conversationId);

    if (conversation === undefined) {
      continue;
    }

    const folderConversations = groups.get(assignment.folderId) ?? [];

    folderConversations.push(conversation);
    groups.set(assignment.folderId, folderConversations);
  }

  return groups;
}

export function getReorderedFolderIds(
  orderedFolderIds: readonly string[],
  folderId: string,
  direction: 'down' | 'up',
): readonly string[] | null {
  const currentIndex = orderedFolderIds.indexOf(folderId);
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedFolderIds.length) {
    return null;
  }

  const nextFolderIds = [...orderedFolderIds];
  const currentFolderId = nextFolderIds[currentIndex];
  const targetFolderId = nextFolderIds[nextIndex];

  if (currentFolderId === undefined || targetFolderId === undefined) {
    return null;
  }

  nextFolderIds[currentIndex] = targetFolderId;
  nextFolderIds[nextIndex] = currentFolderId;

  return nextFolderIds;
}

function getAssignmentErrorMessage(error: unknown): string {
  if (error instanceof AssignmentValidationError) {
    return error.issues[0]?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Assignment action failed.';
}
