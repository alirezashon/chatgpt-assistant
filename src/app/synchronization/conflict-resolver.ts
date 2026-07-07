import type {
  ConflictResolution,
  SyncConflict,
  WorkspaceSnapshot,
} from '@/app/synchronization/sync-types';

export class ConflictResolver {
  public resolve(snapshot: WorkspaceSnapshot): ConflictResolution {
    const conflicts: SyncConflict[] = [];
    const folderIds = new Set<string>();
    const duplicateFolderIds = new Set<string>();

    for (const folder of snapshot.folders.folders) {
      if (folderIds.has(folder.id)) {
        duplicateFolderIds.add(folder.id);
        continue;
      }

      folderIds.add(folder.id);
    }

    for (const folderId of duplicateFolderIds) {
      conflicts.push({
        code: 'DUPLICATE_FOLDER',
        message: `Duplicate folder id detected: ${folderId}`,
        severity: 'error',
      });
    }

    const assignmentConversationIds = new Set<string>();
    const duplicateAssignmentIds = new Set<string>();
    const conversationIds = new Set(
      snapshot.conversations.conversations.map((conversation) => conversation.id),
    );

    const validAssignments = snapshot.assignments.assignments.filter((assignment) => {
      if (assignmentConversationIds.has(assignment.conversationId)) {
        duplicateAssignmentIds.add(assignment.conversationId);
        return false;
      }

      assignmentConversationIds.add(assignment.conversationId);

      if (!folderIds.has(assignment.folderId)) {
        conflicts.push({
          code: 'MISSING_FOLDER_FOR_ASSIGNMENT',
          message: 'Assignment references a missing folder.',
          severity: 'error',
        });
        return false;
      }

      if (!conversationIds.has(assignment.conversationId)) {
        conflicts.push({
          code: 'MISSING_CONVERSATION_FOR_ASSIGNMENT',
          message: 'Assignment references a conversation that is not currently detected.',
          severity: 'warning',
        });
      }

      return true;
    });

    for (const conversationId of duplicateAssignmentIds) {
      conflicts.push({
        code: 'DUPLICATE_ASSIGNMENT',
        message: `Duplicate assignment detected for conversation ${conversationId}`,
        severity: 'error',
      });
    }

    return {
      conflicts,
      recoveredSnapshot: {
        ...snapshot,
        assignments: {
          ...snapshot.assignments,
          assignments: validAssignments,
        },
        folders: {
          ...snapshot.folders,
          folders: snapshot.folders.folders.filter((folder) => !duplicateFolderIds.has(folder.id)),
        },
      },
    };
  }
}
