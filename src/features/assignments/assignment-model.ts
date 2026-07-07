import type {
  AssignConversationInput,
  ConversationAssignment,
} from '@/features/assignments/assignment-types';
import type { EntityId, ISODateTimeString } from '@/shared/types';

interface CreateAssignmentInput extends AssignConversationInput {
  readonly assignmentId: EntityId;
  readonly createdAt: ISODateTimeString;
}

export function createAssignmentModel(input: CreateAssignmentInput): ConversationAssignment {
  return {
    assignmentId: input.assignmentId,
    conversationId: input.conversationId,
    createdAt: input.createdAt,
    folderId: input.folderId,
    metadata: {
      source: 'manual',
    },
    updatedAt: input.createdAt,
  };
}
