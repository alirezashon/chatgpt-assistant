import { AppError } from '@/shared/errors';
import type { FolderValidationIssue } from '@/features/folders/folder-types';

export class FolderValidationError extends AppError {
  public readonly issues: readonly FolderValidationIssue[];

  public constructor(message: string, issues: readonly FolderValidationIssue[]) {
    super('FOLDER_VALIDATION_ERROR', message, {
      context: {
        issues,
      },
    });
    this.name = 'FolderValidationError';
    this.issues = issues;
  }
}

export class FolderNotFoundError extends AppError {
  public constructor(folderId: string) {
    super('FOLDER_NOT_FOUND', 'Folder was not found.', {
      context: {
        folderId,
      },
    });
    this.name = 'FolderNotFoundError';
  }
}
