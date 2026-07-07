import type { EntityId, ISODateTimeString } from '@/shared/types';

export type AssignmentStatus = 'error' | 'idle' | 'loading' | 'ready' | 'saving';

export interface ConversationAssignmentMetadata {
  readonly source: 'manual';
}

export interface ConversationAssignment {
  readonly assignmentId: EntityId;
  readonly conversationId: EntityId;
  readonly createdAt: ISODateTimeString;
  readonly folderId: EntityId;
  readonly metadata: ConversationAssignmentMetadata;
  readonly updatedAt: ISODateTimeString;
}

export interface AssignmentState {
  readonly assignments: readonly ConversationAssignment[];
  readonly error: Error | null;
  readonly status: AssignmentStatus;
}

export interface AssignConversationInput {
  readonly conversationId: EntityId;
  readonly folderId: EntityId;
}

export type MoveConversationInput = AssignConversationInput;

export interface RemoveAssignmentInput {
  readonly conversationId: EntityId;
}

export type AssignmentValidationCode =
  'CONVERSATION_NOT_FOUND' | 'FOLDER_NOT_FOUND' | 'INVALID_ASSIGNMENT';

export interface AssignmentValidationIssue {
  readonly code: AssignmentValidationCode;
  readonly message: string;
}
