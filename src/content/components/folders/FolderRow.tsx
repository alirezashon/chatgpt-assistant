import { memo } from 'react';

import { AssignedConversationList } from '@/content/components/folders/AssignedConversationList';
import { FolderMenu } from '@/content/components/folders/FolderMenu';
import { FolderGlyph } from '@/content/components/icons/FolderGlyph';
import { MoreIcon } from '@/content/components/icons/MoreIcon';
import type { Conversation } from '@/features/conversations';
import type { Folder } from '@/shared/types';

interface FolderRowProps {
  readonly canMoveDown: boolean;
  readonly canMoveUp: boolean;
  readonly conversationCount: number;
  readonly conversations: readonly Conversation[];
  readonly folder: Folder;
  readonly isActive: boolean;
  readonly isExpanded: boolean;
  readonly isMenuOpen: boolean;
  readonly onDelete: (folder: Folder) => void;
  readonly onMoveDown: (folder: Folder) => void;
  readonly onMoveUp: (folder: Folder) => void;
  readonly onRename: (folder: Folder) => void;
  readonly onSelect: (folder: Folder) => void;
  readonly onToggleExpanded: (folderId: string) => void;
  readonly onToggleMenu: (folderId: string) => void;
}

export const FolderRow = memo(function FolderRow({
  canMoveDown,
  canMoveUp,
  conversationCount,
  conversations,
  folder,
  isActive,
  isExpanded,
  isMenuOpen,
  onDelete,
  onMoveDown,
  onMoveUp,
  onRename,
  onSelect,
  onToggleExpanded,
  onToggleMenu,
}: FolderRowProps) {
  return (
    <li className="cgw-folder-in relative">
      <div
        className={[
          'group flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 transition duration-200 hover:bg-slate-50',
          isActive ? 'bg-slate-100 shadow-sm' : '',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'h-8 w-1 shrink-0 rounded-full transition',
            isActive ? 'opacity-100' : 'opacity-70',
          ].join(' ')}
          style={{ backgroundColor: folder.color }}
        />

        <button
          aria-current={isActive ? 'true' : undefined}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
          type="button"
          onClick={() => {
            onSelect(folder);
            onToggleExpanded(folder.id);
          }}
        >
          <span className="shrink-0 text-slate-600">
            <FolderGlyph icon={folder.icon} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
            {folder.name}
          </span>
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
            {conversationCount}
          </span>
        </button>

        <button
          aria-expanded={isMenuOpen}
          aria-label={`Open actions for ${folder.name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-950 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
          type="button"
          onClick={() => {
            onToggleMenu(folder.id);
          }}
        >
          <MoreIcon />
        </button>
      </div>

      {isMenuOpen ? (
        <FolderMenu
          canMoveDown={canMoveDown}
          canMoveUp={canMoveUp}
          folder={folder}
          onDelete={onDelete}
          onMoveDown={onMoveDown}
          onMoveUp={onMoveUp}
          onRename={onRename}
        />
      ) : null}

      {isExpanded || isActive ? <AssignedConversationList conversations={conversations} /> : null}
    </li>
  );
});
