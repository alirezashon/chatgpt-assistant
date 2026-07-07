import { conversationStore, initialConversationState } from '@/features/conversations';
import { folderStore, initialFolderState } from '@/features/folders';
import { createStore } from '@/state';
import type { WorkspaceRuntimeState } from '@/app/workspace/workspace-types';
import { createDefaultWorkspaceConfig } from '@/app/workspace/workspace-config';
import { assignmentStore, initialAssignmentState } from '@/features/assignments';

const defaultConfig = createDefaultWorkspaceConfig();

export const initialWorkspaceState: WorkspaceRuntimeState = {
  activeConversationId: null,
  activeFolderId: null,
  assignments: initialAssignmentState,
  conversations: initialConversationState,
  error: null,
  folders: initialFolderState,
  lifecycle: 'boot',
  updatedAt: defaultConfig.workspace.createdAt,
  workspace: defaultConfig.workspace,
};

export const workspaceStore = createStore<WorkspaceRuntimeState>(initialWorkspaceState);

export function readCurrentWorkspaceSubsystemState(): Pick<
  WorkspaceRuntimeState,
  'activeConversationId' | 'activeFolderId' | 'assignments' | 'conversations' | 'folders'
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
  };
}
