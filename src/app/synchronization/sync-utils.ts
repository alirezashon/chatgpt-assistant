import type { WorkspaceSnapshot } from '@/app/synchronization/sync-types';
import { AppError } from '@/shared/errors';

export function createSnapshotSignature(snapshot: WorkspaceSnapshot): string {
  return JSON.stringify({
    assignments: snapshot.assignments.assignments,
    conversations: snapshot.conversations.conversations.map((conversation) => ({
      id: conversation.id,
      isActive: conversation.isActive,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      url: conversation.url,
    })),
    folders: {
      folders: snapshot.folders.folders,
      selectedFolderId: snapshot.folders.selectedFolderId,
    },
    uiPreferences: snapshot.uiPreferences,
    workspace: {
      activeConversationId: snapshot.workspace.activeConversationId,
      activeFolderId: snapshot.workspace.activeFolderId,
      workspaceId: snapshot.workspace.workspace.id,
      workspaceUpdatedAt: snapshot.workspace.workspace.updatedAt,
    },
  });
}

export function toSyncError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown synchronization error.');
}

export function isExtensionContextInvalidatedError(error: unknown): boolean {
  if (error instanceof AppError && error.code === 'EXTENSION_CONTEXT_INVALIDATED') {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('Extension context invalidated');
}
