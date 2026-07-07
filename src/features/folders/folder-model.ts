import { DEFAULT_FOLDER_COLOR, DEFAULT_FOLDER_ICON } from '@/features/folders/folder-constants';
import { normalizeFolderName } from '@/features/folders/folder-validation';
import type { CreateFolderInput } from '@/features/folders/folder-types';
import type { EntityId, Folder, ISODateTimeString } from '@/shared/types';

interface CreateFolderModelInput extends CreateFolderInput {
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly order: number;
}

export function createFolderModel(input: CreateFolderModelInput): Folder {
  return {
    color: input.color ?? DEFAULT_FOLDER_COLOR,
    createdAt: input.createdAt,
    icon: input.icon ?? DEFAULT_FOLDER_ICON,
    id: input.id,
    name: normalizeFolderName(input.name),
    order: input.order,
    updatedAt: input.createdAt,
  };
}

export function sortFoldersByOrder(folders: readonly Folder[]): readonly Folder[] {
  return [...folders].sort((firstFolder, secondFolder) => {
    if (firstFolder.order === secondFolder.order) {
      return firstFolder.createdAt.localeCompare(secondFolder.createdAt);
    }

    return firstFolder.order - secondFolder.order;
  });
}
