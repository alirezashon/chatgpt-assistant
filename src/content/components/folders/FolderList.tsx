import { FolderEmptyState } from '@/content/components/folders/FolderEmptyState';
import { FolderRow } from '@/content/components/folders/FolderRow';
import { FolderSkeletonList } from '@/content/components/folders/FolderSkeletonList';
import { FieldError } from '@/content/components/ui/FieldError';
import { ScrollableArea } from '@/content/components/ui/ScrollableArea';
import type { FolderStatus } from '@/features/folders';
import type { Conversation } from '@/features/conversations';
import type { Folder } from '@/shared/types';

interface FolderListProps {
  readonly conversationsByFolderId: ReadonlyMap<string, readonly Conversation[]>;
  readonly expandedFolderIds: ReadonlySet<string>;
  readonly error: Error | null;
  readonly folders: readonly Folder[];
  readonly openMenuId: string | null;
  readonly selectedFolderId: string | null;
  readonly status: FolderStatus;
  readonly onCreate: () => void;
  readonly onDelete: (folder: Folder) => void;
  readonly onMoveDown: (folder: Folder) => void;
  readonly onMoveUp: (folder: Folder) => void;
  readonly onRename: (folder: Folder) => void;
  readonly onSelect: (folder: Folder) => void;
  readonly onToggleExpanded: (folderId: string) => void;
  readonly onToggleMenu: (folderId: string) => void;
}

export function FolderList({
  conversationsByFolderId,
  error,
  expandedFolderIds,
  folders,
  onCreate,
  onDelete,
  onMoveDown,
  onMoveUp,
  onRename,
  onSelect,
  onToggleExpanded,
  onToggleMenu,
  openMenuId,
  selectedFolderId,
  status,
}: FolderListProps) {
  if (folders.length === 0 && status === 'loading') {
    return <FolderSkeletonList />;
  }

  return (
    <ScrollableArea className="flex-1 px-4 py-4">
      <FieldError>{error?.message ?? null}</FieldError>

      {folders.length === 0 ? <FolderEmptyState onCreate={onCreate} /> : null}

      {folders.length > 0 ? (
        <ul className="mt-3 space-y-1" aria-label="Folders">
          {folders.map((folder, index) => (
            <FolderRow
              key={folder.id}
              canMoveDown={index < folders.length - 1}
              canMoveUp={index > 0}
              conversationCount={conversationsByFolderId.get(folder.id)?.length ?? 0}
              conversations={conversationsByFolderId.get(folder.id) ?? []}
              folder={folder}
              isActive={selectedFolderId === folder.id}
              isExpanded={expandedFolderIds.has(folder.id)}
              isMenuOpen={openMenuId === folder.id}
              onDelete={onDelete}
              onMoveDown={onMoveDown}
              onMoveUp={onMoveUp}
              onRename={onRename}
              onSelect={onSelect}
              onToggleExpanded={onToggleExpanded}
              onToggleMenu={onToggleMenu}
            />
          ))}
        </ul>
      ) : null}
    </ScrollableArea>
  );
}
