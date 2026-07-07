import type { WorkspaceRuntimeState } from '@/app/workspace/workspace-types';
import { assignmentStore } from '@/features/assignments';
import { conversationStore } from '@/features/conversations';
import { folderStore } from '@/features/folders';

export function createRuntimeStatePatch(): Pick<
  WorkspaceRuntimeState,
  | 'activeConversationId'
  | 'activeFolderId'
  | 'assignments'
  | 'conversations'
  | 'folders'
  | 'updatedAt'
> {
  const assignments = assignmentStore.getState();
  const conversations = conversationStore.getState();
  const folders = folderStore.getState();

  return {
    activeConversationId: conversations.activeConversationId,
    activeFolderId: folders.selectedFolderId,
    assignments,
    conversations,
    folders,
    updatedAt: new Date().toISOString(),
  };
}

export function toWorkspaceError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown workspace error.');
}
