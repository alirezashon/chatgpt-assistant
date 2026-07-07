import {
  exportService,
  favoriteService,
  tagService,
  workspaceService,
  type ExportService,
  type FavoriteService,
  type TagService,
  type WorkspaceService,
} from '@/services';
import {
  DefaultFolderService,
  StorageFolderRepository,
  type FolderService,
} from '@/features/folders';
import { logger, type Logger } from '@/shared/logger';
import { extensionStore, type ExtensionState } from '@/state';
import type { Store } from '@/state/store';
import { ChromeStorageDriver, type StorageDriver } from '@/storage';

export interface ExtensionServices {
  readonly exportService: ExportService;
  readonly favoriteService: FavoriteService;
  readonly folderService: FolderService;
  readonly tagService: TagService;
  readonly workspaceService: WorkspaceService;
}

export interface ExtensionFoundation {
  readonly logger: Logger;
  readonly services: ExtensionServices;
  readonly state: Store<ExtensionState>;
  readonly storage: StorageDriver;
}

export function createExtensionFoundation(
  storage: StorageDriver = new ChromeStorageDriver(),
): ExtensionFoundation {
  const folderService = new DefaultFolderService({
    repository: new StorageFolderRepository(storage),
  });

  return {
    logger,
    services: {
      exportService,
      favoriteService,
      folderService,
      tagService,
      workspaceService,
    },
    state: extensionStore,
    storage,
  };
}
