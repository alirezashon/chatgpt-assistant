import { createFolderModel, sortFoldersByOrder } from '@/features/folders/folder-model';
import type { FolderRepository } from '@/features/folders/folder-repository';
import { StorageFolderRepository } from '@/features/folders/folder-repository';
import { folderStore } from '@/features/folders/folder-store';
import {
  assertFolderNameIsValid,
  assertFolderOrderIsValid,
  assertReorderInputIsValid,
  createCurrentDate,
  createEntityId,
  findFolderInMapOrThrow,
  findFolderOrThrow,
  getNextFolderOrder,
  normalizeFolderName,
  toFolderServiceError,
} from '@/features/folders/folder-service-utils';
import type {
  CreateFolderInput,
  FolderState,
  ReorderFoldersInput,
  RenameFolderInput,
  SelectFolderInput,
  UpdateFolderInput,
} from '@/features/folders/folder-types';
import type { EntityId, Folder } from '@/shared/types';
import type { Store } from '@/state';
import { ChromeStorageDriver } from '@/storage';
import type { StorageUnsubscribe } from '@/storage';

export interface FolderService {
  createFolder(input: CreateFolderInput): Promise<Folder>;
  deleteFolder(folderId: EntityId): Promise<void>;
  getFolders(): Promise<readonly Folder[]>;
  initialize(): Promise<void>;
  renameFolder(input: RenameFolderInput): Promise<Folder>;
  reorderFolders(input: ReorderFoldersInput): Promise<readonly Folder[]>;
  selectFolder(input: SelectFolderInput): Promise<void>;
  updateFolder(input: UpdateFolderInput): Promise<Folder>;
}

interface FolderServiceOptions {
  readonly clock?: () => Date;
  readonly idGenerator?: () => EntityId;
  readonly repository: FolderRepository;
  readonly store?: Store<FolderState>;
}

export class DefaultFolderService implements FolderService {
  private readonly clock: () => Date;
  private readonly idGenerator: () => EntityId;
  private readonly repository: FolderRepository;
  private readonly store: Store<FolderState>;
  private unsubscribeFromRepository: StorageUnsubscribe | null = null;

  public constructor(options: FolderServiceOptions) {
    this.clock = options.clock ?? createCurrentDate;
    this.idGenerator = options.idGenerator ?? createEntityId;
    this.repository = options.repository;
    this.store = options.store ?? folderStore;
  }

  public async initialize(): Promise<void> {
    this.unsubscribeFromRepository ??= this.repository.subscribe(() => {
      void this.synchronizeFromRepository();
    });

    await this.synchronizeFromRepository();
  }

  public async getFolders(): Promise<readonly Folder[]> {
    return await this.synchronizeFromRepository();
  }

  public async createFolder(input: CreateFolderInput): Promise<Folder> {
    const folders = await this.repository.getFolders();
    const previousState = this.store.getState();
    assertFolderNameIsValid(input.name, folders);

    const createdAt = this.clock().toISOString();
    const folder = createFolderModel({
      ...input,
      createdAt,
      id: this.idGenerator(),
      order: getNextFolderOrder(folders),
    });

    await this.persistFolders([...folders, folder], {
      previousState,
      selectedFolderId: folder.id,
    });

    return folder;
  }

  public async renameFolder(input: RenameFolderInput): Promise<Folder> {
    return await this.updateFolder({
      id: input.id,
      name: input.name,
    });
  }

  public async updateFolder(input: UpdateFolderInput): Promise<Folder> {
    const folders = await this.repository.getFolders();
    const previousState = this.store.getState();
    const currentFolder = findFolderOrThrow(folders, input.id);

    if (input.name !== undefined) {
      assertFolderNameIsValid(input.name, folders, input.id);
    }

    if (input.order !== undefined) {
      assertFolderOrderIsValid(input.order);
    }

    const updatedFolder: Folder = {
      ...currentFolder,
      color: input.color ?? currentFolder.color,
      icon: input.icon ?? currentFolder.icon,
      name: input.name === undefined ? currentFolder.name : normalizeFolderName(input.name),
      order: input.order ?? currentFolder.order,
      updatedAt: this.clock().toISOString(),
    };

    await this.persistFolders(
      folders.map((folder) => (folder.id === updatedFolder.id ? updatedFolder : folder)),
      {
        previousState,
      },
    );

    return updatedFolder;
  }

  public async deleteFolder(folderId: EntityId): Promise<void> {
    const folders = await this.repository.getFolders();
    const previousState = this.store.getState();
    findFolderOrThrow(folders, folderId);

    const nextSelectedFolderId =
      previousState.selectedFolderId === folderId ? null : previousState.selectedFolderId;

    await this.persistFolders(
      folders.filter((folder) => folder.id !== folderId),
      {
        previousState,
        selectedFolderId: nextSelectedFolderId,
      },
    );
  }

  public async reorderFolders(input: ReorderFoldersInput): Promise<readonly Folder[]> {
    const folders = await this.repository.getFolders();
    const previousState = this.store.getState();
    assertReorderInputIsValid(input.orderedFolderIds, folders);

    const folderById = new Map(folders.map((folder) => [folder.id, folder]));
    const now = this.clock().toISOString();
    const reorderedFolders = input.orderedFolderIds.map((folderId, order) => ({
      ...findFolderInMapOrThrow(folderById, folderId),
      order,
      updatedAt: now,
    }));

    await this.persistFolders(reorderedFolders, {
      previousState,
    });

    return sortFoldersByOrder(reorderedFolders);
  }

  public async selectFolder(input: SelectFolderInput): Promise<void> {
    const previousState = this.store.getState();

    if (input.id !== null) {
      const folders = await this.repository.getFolders();
      findFolderOrThrow(folders, input.id);
    }

    this.store.setState({
      error: null,
      selectedFolderId: input.id,
      status: 'ready',
    });

    try {
      await this.repository.saveSelectedFolderId(input.id);
    } catch (error) {
      this.store.replaceState(previousState);
      this.store.setState({
        error: toFolderServiceError(error),
        status: 'error',
      });
      throw error;
    }
  }

  private async synchronizeFromRepository(): Promise<readonly Folder[]> {
    this.store.setState({
      error: null,
      status: 'loading',
    });

    try {
      const [folders, selectedFolderId] = await Promise.all([
        this.repository.getFolders(),
        this.repository.getSelectedFolderId(),
      ]);
      const sortedFolders = sortFoldersByOrder(folders);
      const validSelectedFolderId = sortedFolders.some((folder) => folder.id === selectedFolderId)
        ? selectedFolderId
        : null;

      this.store.setState({
        error: null,
        folders: sortedFolders,
        selectedFolderId: validSelectedFolderId,
        status: 'ready',
      });

      return sortedFolders;
    } catch (error) {
      this.store.setState({
        error: toFolderServiceError(error),
        status: 'error',
      });
      throw error;
    }
  }

  private async persistFolders(
    folders: readonly Folder[],
    options: {
      readonly previousState: FolderState;
      readonly selectedFolderId?: EntityId | null;
    },
  ): Promise<void> {
    const sortedFolders = sortFoldersByOrder(folders);
    const selectedFolderId = options.selectedFolderId ?? this.store.getState().selectedFolderId;

    this.store.setState({
      error: null,
      folders: sortedFolders,
      selectedFolderId,
      status: 'saving',
    });

    try {
      await Promise.all([
        this.repository.saveFolders(sortedFolders),
        this.repository.saveSelectedFolderId(selectedFolderId),
      ]);
      this.store.setState({
        error: null,
        folders: sortedFolders,
        selectedFolderId,
        status: 'ready',
      });
    } catch (error) {
      this.store.replaceState(options.previousState);
      this.store.setState({
        error: toFolderServiceError(error),
        status: 'error',
      });
      throw error;
    }
  }
}

let defaultFolderService: FolderService | null = null;

export function getFolderService(): FolderService {
  defaultFolderService ??= new DefaultFolderService({
    repository: new StorageFolderRepository(new ChromeStorageDriver()),
  });

  return defaultFolderService;
}
