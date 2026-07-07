import { AssignmentNotFoundError, AssignmentValidationError } from '@/features/assignments';
import { FolderValidationError } from '@/features/folders';

export function formatConversationTime(value: string): string {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });

  return formatter.format(new Date(timestamp));
}

export function getExplorerErrorMessage(error: unknown): string {
  if (error instanceof FolderValidationError || error instanceof AssignmentValidationError) {
    return error.issues[0]?.message ?? error.message;
  }

  if (error instanceof AssignmentNotFoundError) {
    return 'This conversation is not assigned to a folder.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Workspace action failed.';
}
