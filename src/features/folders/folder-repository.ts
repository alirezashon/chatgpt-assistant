import { STORAGE_KEYS } from '@/constants/storage';
import { sortFoldersByOrder } from '@/features/folders/folder-model';
import type { StorageDriver, StorageUnsubscribe } from '@/storage';
import type { Folder } from '@/shared/types';

export interface FolderRepository {
  getFolders(): Promise<readonly Folder[]>;
  getSelectedFolderId(): Promise<string | null>;
  saveFolders(folders: readonly Folder[]): Promise<void>;
  saveSelectedFolderId(folderId: string | null): Promise<void>;
  subscribe(listener: () => void): StorageUnsubscribe;
}

export class StorageFolderRepository implements FolderRepository {
  private readonly storage: StorageDriver;

  public constructor(storage: StorageDriver) {
    this.storage = storage;
  }

  public async getFolders(): Promise<readonly Folder[]> {
    const storedFolders = await this.storage.get(STORAGE_KEYS.folders);

    if (!Array.isArray(storedFolders)) {
      return [];
    }

    return sortFoldersByOrder(storedFolders.filter(isFolder));
  }

  public async getSelectedFolderId(): Promise<string | null> {
    const selectedFolderId = await this.storage.get(STORAGE_KEYS.selectedFolderId);

    return typeof selectedFolderId === 'string' ? selectedFolderId : null;
  }

  public async saveFolders(folders: readonly Folder[]): Promise<void> {
    await this.storage.set(STORAGE_KEYS.folders, sortFoldersByOrder(folders));
  }

  public async saveSelectedFolderId(folderId: string | null): Promise<void> {
    if (folderId === null) {
      await this.storage.remove(STORAGE_KEYS.selectedFolderId);
      return;
    }

    await this.storage.set(STORAGE_KEYS.selectedFolderId, folderId);
  }

  public subscribe(listener: () => void): StorageUnsubscribe {
    return this.storage.subscribe((changes) => {
      const hasFolderChange = changes.some(
        (change) =>
          change.key === STORAGE_KEYS.folders || change.key === STORAGE_KEYS.selectedFolderId,
      );

      if (hasFolderChange) {
        listener();
      }
    });
  }
}

function isFolder(value: unknown): value is Folder {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['color'] === 'string' &&
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['icon'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['name'] === 'string' &&
    typeof candidate['order'] === 'number' &&
    typeof candidate['updatedAt'] === 'string'
  );
}
