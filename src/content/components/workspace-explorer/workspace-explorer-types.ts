import type { ConversationAssignment } from '@/features/assignments';
import type { Conversation } from '@/features/conversations';
import type { Folder } from '@/shared/types';

export type ExplorerFilter = 'all' | 'favorites' | 'folder' | 'recent' | 'unassigned';

export interface ExplorerFolderNode {
  readonly assignmentCount: number;
  readonly children: readonly ExplorerFolderNode[];
  readonly depth: number;
  readonly folder: Folder;
}

export interface ExplorerConversationItem {
  readonly assignment: ConversationAssignment | null;
  readonly conversation: Conversation;
  readonly folder: Folder | null;
  readonly isActive: boolean;
  readonly isFavorite: boolean;
}

export interface WorkspaceExplorerStats {
  readonly assignedConversations: number;
  readonly folderCount: number;
  readonly totalConversations: number;
  readonly unassignedConversations: number;
}

export interface WorkspaceExplorerModel {
  readonly activeConversation: Conversation | null;
  readonly activeConversationAssignment: ConversationAssignment | null;
  readonly conversations: readonly ExplorerConversationItem[];
  readonly folderNodes: readonly ExplorerFolderNode[];
  readonly selectedFolder: Folder | null;
  readonly stats: WorkspaceExplorerStats;
}
