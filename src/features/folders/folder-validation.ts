import {
  FOLDER_NAME_MAX_LENGTH,
  FOLDER_NAME_MIN_LENGTH,
  INVALID_FOLDER_NAME_CHARACTERS,
} from '@/features/folders/folder-constants';
import type {
  FolderValidationIssue,
  FolderValidationResult,
} from '@/features/folders/folder-types';
import type { EntityId, Folder } from '@/shared/types';

interface FolderNameValidationOptions {
  readonly currentFolderId?: EntityId | undefined;
  readonly existingFolders?: readonly Folder[];
}

export function normalizeFolderName(name: string): string {
  return name.trim().replace(/\s+/gu, ' ');
}

export function createFolderNameKey(name: string): string {
  return normalizeFolderName(name).toLocaleLowerCase();
}

export function validateFolderName(
  name: string,
  options: FolderNameValidationOptions = {},
): FolderValidationResult {
  const normalizedName = normalizeFolderName(name);
  const issues: FolderValidationIssue[] = [];

  if (normalizedName.length < FOLDER_NAME_MIN_LENGTH) {
    issues.push({
      code: 'EMPTY_FOLDER_NAME',
      message: 'Folder name cannot be empty.',
    });
  }

  if (normalizedName.length > FOLDER_NAME_MAX_LENGTH) {
    issues.push({
      code: 'MAX_FOLDER_NAME_LENGTH_EXCEEDED',
      message: `Folder name cannot exceed ${FOLDER_NAME_MAX_LENGTH.toString()} characters.`,
    });
  }

  if (hasInvalidFolderNameCharacters(normalizedName)) {
    issues.push({
      code: 'INVALID_FOLDER_NAME_CHARACTERS',
      message: 'Folder name contains unsupported characters.',
    });
  }

  const existingFolders = options.existingFolders ?? [];
  const nameKey = createFolderNameKey(normalizedName);
  const hasDuplicate = existingFolders.some((folder) => {
    if (folder.id === options.currentFolderId) {
      return false;
    }

    return createFolderNameKey(folder.name) === nameKey;
  });

  if (hasDuplicate) {
    issues.push({
      code: 'DUPLICATE_FOLDER_NAME',
      message: 'A folder with this name already exists.',
    });
  }

  return {
    issues,
    valid: issues.length === 0,
  };
}

function hasInvalidFolderNameCharacters(name: string): boolean {
  for (const character of name) {
    if (character.charCodeAt(0) < 32) {
      return true;
    }

    if ((INVALID_FOLDER_NAME_CHARACTERS as readonly string[]).includes(character)) {
      return true;
    }
  }

  return false;
}

export function validateFolderOrder(order: number): FolderValidationResult {
  const issues: FolderValidationIssue[] = [];

  if (!Number.isInteger(order) || order < 0) {
    issues.push({
      code: 'INVALID_FOLDER_ORDER',
      message: 'Folder order must be a non-negative integer.',
    });
  }

  return {
    issues,
    valid: issues.length === 0,
  };
}
