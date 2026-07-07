import type { WorkspaceRuntimeState } from '@/app/workspace';
import type { ConversationAssignment } from '@/features/assignments';
import type { Folder } from '@/shared/types';
import type {
  ExplorerConversationItem,
  ExplorerFilter,
  ExplorerFolderNode,
  WorkspaceExplorerModel,
  WorkspaceExplorerStats,
} from '@/content/components/workspace-explorer/workspace-explorer-types';

export function createWorkspaceExplorerModel(
  state: WorkspaceRuntimeState,
  filter: ExplorerFilter,
  favoriteIds: ReadonlySet<string> = new Set(),
): WorkspaceExplorerModel {
  const folders = state.folders.folders;
  const conversations = state.conversations.conversations;
  const assignments = state.assignments.assignments;
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const assignmentByConversationId = new Map(
    assignments.map((assignment) => [assignment.conversationId, assignment]),
  );
  const selectedFolder = findSelectedFolder(folders, state.activeFolderId);
  const activeConversation =
    conversations.find((conversation) => conversation.id === state.activeConversationId) ?? null;
  const activeConversationAssignment =
    activeConversation === null
      ? null
      : (assignmentByConversationId.get(activeConversation.id) ?? null);
  const folderNodes = createFolderNodes(folders, assignments);
  const conversationItems = conversations.map<ExplorerConversationItem>((conversation) => {
    const assignment = assignmentByConversationId.get(conversation.id) ?? null;

    return {
      assignment,
      conversation,
      folder: assignment === null ? null : (folderById.get(assignment.folderId) ?? null),
      isActive: conversation.id === state.activeConversationId,
      isFavorite: favoriteIds.has(conversation.id),
    };
  });

  return {
    activeConversation,
    activeConversationAssignment,
    conversations: filterConversationItems(conversationItems, filter, selectedFolder?.id ?? null),
    folderNodes,
    selectedFolder,
    stats: createWorkspaceStats(conversations.length, assignments, folders),
  };
}

function createFolderNodes(
  folders: readonly Folder[],
  assignments: readonly ConversationAssignment[],
): readonly ExplorerFolderNode[] {
  const assignmentCounts = new Map<string, number>();

  for (const assignment of assignments) {
    assignmentCounts.set(assignment.folderId, (assignmentCounts.get(assignment.folderId) ?? 0) + 1);
  }

  return folders.map((folder) => ({
    assignmentCount: assignmentCounts.get(folder.id) ?? 0,
    children: [],
    depth: 0,
    folder,
  }));
}

function createWorkspaceStats(
  totalConversations: number,
  assignments: readonly ConversationAssignment[],
  folders: readonly Folder[],
): WorkspaceExplorerStats {
  const assignedConversationIds = new Set(
    assignments.map((assignment) => assignment.conversationId),
  );

  return {
    assignedConversations: assignedConversationIds.size,
    folderCount: folders.length,
    totalConversations,
    unassignedConversations: Math.max(totalConversations - assignedConversationIds.size, 0),
  };
}

function filterConversationItems(
  conversations: readonly ExplorerConversationItem[],
  filter: ExplorerFilter,
  selectedFolderId: string | null,
): readonly ExplorerConversationItem[] {
  const filteredConversations = conversations.filter((item) => {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'unassigned') {
      return item.assignment === null;
    }

    if (filter === 'favorites') {
      return item.isFavorite;
    }

    if (filter === 'folder') {
      return selectedFolderId !== null && item.assignment?.folderId === selectedFolderId;
    }

    return true;
  });

  return sortConversationItems(filteredConversations);
}

function sortConversationItems(
  conversations: readonly ExplorerConversationItem[],
): readonly ExplorerConversationItem[] {
  return [...conversations].sort((firstItem, secondItem) => {
    if (firstItem.isActive !== secondItem.isActive) {
      return firstItem.isActive ? -1 : 1;
    }

    return secondItem.conversation.updatedAt.localeCompare(firstItem.conversation.updatedAt);
  });
}

function findSelectedFolder(folders: readonly Folder[], folderId: string | null): Folder | null {
  if (folderId === null) {
    return null;
  }

  return folders.find((folder) => folder.id === folderId) ?? null;
}
