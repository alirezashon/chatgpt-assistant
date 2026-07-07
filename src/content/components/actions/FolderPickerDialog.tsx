import { useEffect, useMemo, useRef, useState } from 'react';

import { Modal } from '@/content/components/ui/Modal';
import type { Folder } from '@/shared/types';

interface FolderPickerDialogProps {
  readonly folders: readonly Folder[];
  readonly query: string;
  readonly recentFolderIds: readonly string[];
  readonly targetCount: number;
  readonly onClose: () => void;
  readonly onMove: (folderId: string) => void;
  readonly onQueryChange: (query: string) => void;
}

export function FolderPickerDialog({
  folders,
  onClose,
  onMove,
  onQueryChange,
  query,
  recentFolderIds,
  targetCount,
}: FolderPickerDialogProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredFolders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (normalizedQuery.length === 0) {
      return folders;
    }

    return folders.filter((folder) => folder.name.toLocaleLowerCase().includes(normalizedQuery));
  }, [folders, query]);
  const recentFolders = useMemo(
    () =>
      recentFolderIds
        .map((folderId) => folders.find((folder) => folder.id === folderId) ?? null)
        .filter((folder): folder is Folder => folder !== null),
    [folders, recentFolderIds],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const selectedActiveFolderId = filteredFolders.some((folder) => folder.id === activeFolderId)
    ? activeFolderId
    : (filteredFolders[0]?.id ?? null);

  const moveActiveSelection = (direction: 1 | -1) => {
    if (filteredFolders.length === 0) {
      return;
    }

    const currentIndex = filteredFolders.findIndex(
      (folder) => folder.id === selectedActiveFolderId,
    );
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + filteredFolders.length) % filteredFolders.length;

    setActiveFolderId(filteredFolders[nextIndex]?.id ?? null);
  };

  return (
    <Modal title="Move to Folder" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Move {targetCount} conversation{targetCount === 1 ? '' : 's'}.
        </p>
        <input
          ref={inputRef}
          className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
          placeholder="Search folders..."
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onClose();
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              moveActiveSelection(1);
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              moveActiveSelection(-1);
            }

            if (event.key === 'Enter' && selectedActiveFolderId !== null) {
              event.preventDefault();
              onMove(selectedActiveFolderId);
            }
          }}
        />

        {recentFolders.length > 0 ? (
          <FolderPickerSection
            activeFolderId={selectedActiveFolderId}
            folders={recentFolders}
            title="Recently Used"
            onMove={onMove}
          />
        ) : null}
        <FolderPickerSection
          activeFolderId={selectedActiveFolderId}
          folders={filteredFolders}
          title="Folders"
          onMove={onMove}
        />
      </div>
    </Modal>
  );
}

interface FolderPickerSectionProps {
  readonly activeFolderId: string | null;
  readonly folders: readonly Folder[];
  readonly title: string;
  readonly onMove: (folderId: string) => void;
}

function FolderPickerSection({ activeFolderId, folders, onMove, title }: FolderPickerSectionProps) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {title}
      </h4>
      {folders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
          No folders found.
        </p>
      ) : (
        <ul className="max-h-52 space-y-1 overflow-y-auto" aria-label={title}>
          {folders.map((folder) => (
            <li key={folder.id}>
              <button
                className={[
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none',
                  activeFolderId === folder.id ? 'bg-slate-100' : '',
                ].join(' ')}
                type="button"
                onClick={() => onMove(folder.id)}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
