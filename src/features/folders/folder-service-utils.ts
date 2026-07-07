import { FolderNotFoundError, FolderValidationError } from '@/features/folders/folder-errors';
import {
  normalizeFolderName,
  validateFolderName,
  validateFolderOrder,
} from '@/features/folders/folder-validation';
import type { FolderValidationIssue } from '@/features/folders/folder-types';
import type { EntityId, Folder } from '@/shared/types';

export function assertFolderNameIsValid(
  name: string,
  existingFolders: readonly Folder[],
  currentFolderId?: EntityId,
): void {
  const validation = validateFolderName(name, {
    currentFolderId,
    existingFolders,
  });

  if (!validation.valid) {
    throw new FolderValidationError('Folder name is invalid.', validation.issues);
  }
}

export function assertFolderOrderIsValid(order: number): void {
  const validation = validateFolderOrder(order);

  if (!validation.valid) {
    throw new FolderValidationError('Folder order is invalid.', validation.issues);
  }
}

export function assertReorderInputIsValid(
  orderedFolderIds: readonly EntityId[],
  folders: readonly Folder[],
): void {
  const folderIds = new Set(folders.map((folder) => folder.id));
  const orderedIds = new Set(orderedFolderIds);
  const issues: FolderValidationIssue[] = [];

  if (orderedIds.size !== orderedFolderIds.length) {
    issues.push({
      code: 'INVALID_FOLDER_ORDER',
      message: 'Folder reorder input cannot contain duplicate IDs.',
    });
  }

  if (orderedIds.size !== folderIds.size) {
    issues.push({
      code: 'INVALID_FOLDER_ORDER',
      message: 'Folder reorder input must include every folder exactly once.',
    });
  }

  for (const folderId of orderedIds) {
    if (!folderIds.has(folderId)) {
      issues.push({
        code: 'FOLDER_NOT_FOUND',
        message: 'Folder reorder input contains an unknown folder ID.',
      });
      break;
    }
  }

  if (issues.length > 0) {
    throw new FolderValidationError('Folder reorder input is invalid.', issues);
  }
}

export function createCurrentDate(): Date {
  return new Date();
}

export function createEntityId(): EntityId {
  return crypto.randomUUID();
}

export function findFolderOrThrow(folders: readonly Folder[], folderId: EntityId): Folder {
  const folder = folders.find((candidate) => candidate.id === folderId);

  if (folder === undefined) {
    throw new FolderNotFoundError(folderId);
  }

  return folder;
}

export function findFolderInMapOrThrow(
  folderById: ReadonlyMap<EntityId, Folder>,
  folderId: EntityId,
): Folder {
  const folder = folderById.get(folderId);

  if (folder === undefined) {
    throw new FolderNotFoundError(folderId);
  }

  return folder;
}

export function getNextFolderOrder(folders: readonly Folder[]): number {
  const highestOrder = folders.reduce(
    (currentHighestOrder, folder) => Math.max(currentHighestOrder, folder.order),
    -1,
  );

  return highestOrder + 1;
}

export function toFolderServiceError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown folder error.');
}

export { normalizeFolderName };
