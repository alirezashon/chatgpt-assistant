import { FolderMenu } from '@/content/components/folders/FolderMenu';
import { FolderGlyph } from '@/content/components/icons/FolderGlyph';
import { MoreIcon } from '@/content/components/icons/MoreIcon';
import type { ExplorerFolderNode } from '@/content/components/workspace-explorer/workspace-explorer-types';
import type { Folder } from '@/shared/types';

interface FolderTreeViewProps {
  readonly expandedFolderIds: ReadonlySet<string>;
  readonly folderNodes: readonly ExplorerFolderNode[];
  readonly openMenuId: string | null;
  readonly selectedFolderId: string | null;
  readonly onDelete: (folder: Folder) => void;
  readonly onMoveDown: (folder: Folder) => void;
  readonly onMoveUp: (folder: Folder) => void;
  readonly onRename: (folder: Folder) => void;
  readonly onSelect: (folder: Folder) => void;
  readonly onToggleExpanded: (folderId: string) => void;
  readonly onToggleMenu: (folderId: string) => void;
}

export function FolderTreeView({
  expandedFolderIds,
  folderNodes,
  onDelete,
  onMoveDown,
  onMoveUp,
  onRename,
  onSelect,
  onToggleExpanded,
  onToggleMenu,
  openMenuId,
  selectedFolderId,
}: FolderTreeViewProps) {
  return (
    <section className="border-b border-slate-200 px-4 py-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Folders
        </h3>
        <span className="text-xs font-medium text-slate-400">{folderNodes.length}</span>
      </div>

      {folderNodes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
          No folders yet.
        </p>
      ) : (
        <ul className="space-y-1" aria-label="Folder tree">
          {folderNodes.map((node, index) => (
            <FolderTreeItem
              key={node.folder.id}
              canMoveDown={index < folderNodes.length - 1}
              canMoveUp={index > 0}
              isExpanded={expandedFolderIds.has(node.folder.id)}
              isMenuOpen={openMenuId === node.folder.id}
              isSelected={selectedFolderId === node.folder.id}
              node={node}
              selectedFolderId={selectedFolderId}
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
      )}
    </section>
  );
}

interface FolderTreeItemProps {
  readonly canMoveDown: boolean;
  readonly canMoveUp: boolean;
  readonly isExpanded: boolean;
  readonly isMenuOpen: boolean;
  readonly isSelected: boolean;
  readonly node: ExplorerFolderNode;
  readonly selectedFolderId: string | null;
  readonly onDelete: (folder: Folder) => void;
  readonly onMoveDown: (folder: Folder) => void;
  readonly onMoveUp: (folder: Folder) => void;
  readonly onRename: (folder: Folder) => void;
  readonly onSelect: (folder: Folder) => void;
  readonly onToggleExpanded: (folderId: string) => void;
  readonly onToggleMenu: (folderId: string) => void;
}

function FolderTreeItem({
  canMoveDown,
  canMoveUp,
  isExpanded,
  isMenuOpen,
  isSelected,
  node,
  selectedFolderId,
  onDelete,
  onMoveDown,
  onMoveUp,
  onRename,
  onSelect,
  onToggleExpanded,
  onToggleMenu,
}: FolderTreeItemProps) {
  const paddingLeft = `${String(8 + node.depth * 16)}px`;

  return (
    <li className="relative">
      <div
        className={[
          'group flex h-10 items-center gap-2 rounded-lg px-2 transition hover:bg-slate-50',
          isSelected ? 'bg-slate-100 shadow-sm' : '',
        ].join(' ')}
        style={{ paddingLeft }}
      >
        <button
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.folder.name}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-950 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
          type="button"
          onClick={() => {
            onToggleExpanded(node.folder.id);
          }}
        >
          {isExpanded ? '-' : '+'}
        </button>
        <button
          aria-current={isSelected ? 'true' : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
          type="button"
          onClick={() => {
            onSelect(node.folder);
          }}
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: node.folder.color }}
          />
          <span className="shrink-0 text-slate-600">
            <FolderGlyph icon={node.folder.icon} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
            {node.folder.name}
          </span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
            {node.assignmentCount}
          </span>
        </button>
        <button
          aria-expanded={isMenuOpen}
          aria-label={`Open actions for ${node.folder.name}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-950 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
          type="button"
          onClick={() => {
            onToggleMenu(node.folder.id);
          }}
        >
          <MoreIcon />
        </button>
      </div>

      {isMenuOpen ? (
        <FolderMenu
          canMoveDown={canMoveDown}
          canMoveUp={canMoveUp}
          folder={node.folder}
          onDelete={onDelete}
          onMoveDown={onMoveDown}
          onMoveUp={onMoveUp}
          onRename={onRename}
        />
      ) : null}

      {isExpanded && node.children.length > 0 ? (
        <ul className="mt-1 space-y-1">
          {node.children.map((childNode) => (
            <FolderTreeItem
              key={childNode.folder.id}
              canMoveDown={false}
              canMoveUp={false}
              isExpanded={false}
              isMenuOpen={false}
              isSelected={selectedFolderId === childNode.folder.id}
              node={childNode}
              selectedFolderId={selectedFolderId}
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
    </li>
  );
}
