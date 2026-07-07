import { AppError } from '@/shared/errors';
import type { AssignmentValidationIssue } from '@/features/assignments/assignment-types';

export class AssignmentValidationError extends AppError {
  public readonly issues: readonly AssignmentValidationIssue[];

  public constructor(message: string, issues: readonly AssignmentValidationIssue[]) {
    super('ASSIGNMENT_VALIDATION_ERROR', message, {
      context: {
        issues,
      },
    });
    this.name = 'AssignmentValidationError';
    this.issues = issues;
  }
}

export class AssignmentNotFoundError extends AppError {
  public constructor(conversationId: string) {
    super('ASSIGNMENT_NOT_FOUND', 'Conversation assignment was not found.', {
      context: {
        conversationId,
      },
    });
    this.name = 'AssignmentNotFoundError';
  }
}
