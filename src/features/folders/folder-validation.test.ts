import { describe, expect, it } from 'vitest';

import {
  createFolderNameKey,
  normalizeFolderName,
  validateFolderName,
  validateFolderOrder,
} from '@/features/folders/folder-validation';
import type { Folder } from '@/shared/types';

const now = '2026-07-07T00:00:00.000Z';

function createFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    color: '#64748b',
    createdAt: now,
    icon: 'folder',
    id: 'folder-1',
    name: 'Research',
    order: 0,
    updatedAt: now,
    ...overrides,
  };
}

describe('folder validation', () => {
  it('normalizes whitespace before building a folder name key', () => {
    expect(normalizeFolderName('  Client   Projects  ')).toBe('Client Projects');
    expect(createFolderNameKey('  Client   Projects  ')).toBe('client projects');
  });

  it('rejects empty, duplicate, and unsupported folder names', () => {
    expect(validateFolderName('   ').issues.map((issue) => issue.code)).toContain(
      'EMPTY_FOLDER_NAME',
    );

    expect(
      validateFolderName('research', {
        existingFolders: [createFolder()],
      }).issues.map((issue) => issue.code),
    ).toContain('DUPLICATE_FOLDER_NAME');

    expect(validateFolderName('Bad/Name').issues.map((issue) => issue.code)).toContain(
      'INVALID_FOLDER_NAME_CHARACTERS',
    );
  });

  it('allows the current folder to keep its existing name', () => {
    const result = validateFolderName('Research', {
      currentFolderId: 'folder-1',
      existingFolders: [createFolder()],
    });

    expect(result.valid).toBe(true);
  });

  it('requires folder order to be a non-negative integer', () => {
    expect(validateFolderOrder(0).valid).toBe(true);
    expect(validateFolderOrder(2.5).issues.map((issue) => issue.code)).toContain(
      'INVALID_FOLDER_ORDER',
    );
    expect(validateFolderOrder(-1).issues.map((issue) => issue.code)).toContain(
      'INVALID_FOLDER_ORDER',
    );
  });
});
