import type { Folder } from '@/shared/types';

interface FolderMenuProps {
  readonly canMoveDown: boolean;
  readonly canMoveUp: boolean;
  readonly folder: Folder;
  readonly onDelete: (folder: Folder) => void;
  readonly onMoveDown: (folder: Folder) => void;
  readonly onMoveUp: (folder: Folder) => void;
  readonly onRename: (folder: Folder) => void;
}

export function FolderMenu({
  canMoveDown,
  canMoveUp,
  folder,
  onDelete,
  onMoveDown,
  onMoveUp,
  onRename,
}: FolderMenuProps) {
  return (
    <div
      className="cgw-menu-in absolute top-10 right-2 z-10 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg shadow-slate-950/10"
      role="menu"
    >
      <MenuButton
        label="Rename"
        onClick={() => {
          onRename(folder);
        }}
      />
      <MenuButton
        disabled={!canMoveUp}
        label="Move up"
        onClick={() => {
          onMoveUp(folder);
        }}
      />
      <MenuButton
        disabled={!canMoveDown}
        label="Move down"
        onClick={() => {
          onMoveDown(folder);
        }}
      />
      <MenuButton
        danger
        label="Delete"
        onClick={() => {
          onDelete(folder);
        }}
      />
    </div>
  );
}

interface MenuButtonProps {
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onClick: () => void;
}

function MenuButton({ danger = false, disabled = false, label, onClick }: MenuButtonProps) {
  return (
    <button
      className={[
        'flex w-full px-3 py-2 text-left transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
        danger
          ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50'
          : 'text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-50',
      ].join(' ')}
      disabled={disabled}
      role="menuitem"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
