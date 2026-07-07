import { FolderGlyph } from '@/content/components/icons/FolderGlyph';

interface FolderEmptyStateProps {
  readonly onCreate: () => void;
}

export function FolderEmptyState({ onCreate }: FolderEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <FolderGlyph icon="folder" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">No folders yet</h3>
      <p className="mx-auto mt-2 max-w-56 text-sm leading-6 text-slate-500">
        Create your first folder to start organizing your workspace.
      </p>
      <button
        className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-slate-300 focus-visible:outline-none"
        type="button"
        onClick={onCreate}
      >
        New Folder
      </button>
    </div>
  );
}
