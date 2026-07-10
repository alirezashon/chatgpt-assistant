import type {
  ConflictResolution,
  SyncConflict,
  WorkspaceSnapshot,
} from '@/app/synchronization/sync-types';

export class ConflictResolver {
  public resolve(snapshot: WorkspaceSnapshot): ConflictResolution {
    const conflicts: SyncConflict[] = [];
    const folderById = new Map<string, (typeof snapshot.folders.folders)[number]>();
    const duplicateFolderIds = new Set<string>();

    for (const folder of snapshot.folders.folders) {
      const existingFolder = folderById.get(folder.id);

      if (existingFolder !== undefined) {
        duplicateFolderIds.add(folder.id);
      }

      if (existingFolder === undefined || isNewer(folder.updatedAt, existingFolder.updatedAt)) {
        folderById.set(folder.id, folder);
      }
    }

    for (const folderId of duplicateFolderIds) {
      conflicts.push({
        code: 'DUPLICATE_FOLDER',
        message: `Duplicate folder id detected: ${folderId}`,
        severity: 'error',
      });
    }

    const folderIds = new Set(folderById.keys());
    const assignmentByConversationId = new Map<
      string,
      (typeof snapshot.assignments.assignments)[number]
    >();
    const duplicateAssignmentIds = new Set<string>();
    const conversationIds = new Set(
      snapshot.conversations.conversations.map((conversation) => conversation.id),
    );

    for (const assignment of snapshot.assignments.assignments) {
      const existingAssignment = assignmentByConversationId.get(assignment.conversationId);

      if (existingAssignment !== undefined) {
        duplicateAssignmentIds.add(assignment.conversationId);
      }

      if (
        existingAssignment === undefined ||
        isNewer(assignment.updatedAt, existingAssignment.updatedAt)
      ) {
        assignmentByConversationId.set(assignment.conversationId, assignment);
      }
    }

    const validAssignments = Array.from(assignmentByConversationId.values()).filter(
      (assignment) => {
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
      },
    );

    for (const conversationId of duplicateAssignmentIds) {
      conflicts.push({
        code: 'DUPLICATE_ASSIGNMENT',
        message: `Duplicate assignment detected for conversation ${conversationId}`,
        severity: 'error',
      });
    }

    const recoveredFolders = Array.from(folderById.values()).sort((first, second) => {
      return first.order - second.order;
    });
    const recoveredSelectedFolderId = folderIds.has(snapshot.folders.selectedFolderId ?? '')
      ? snapshot.folders.selectedFolderId
      : null;

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
          folders: recoveredFolders,
          selectedFolderId: recoveredSelectedFolderId,
        },
      },
    };
  }
}

function isNewer(firstTimestamp: string, secondTimestamp: string): boolean {
  return Date.parse(firstTimestamp) >= Date.parse(secondTimestamp);
}
