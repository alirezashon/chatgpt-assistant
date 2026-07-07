import { APP_NAME, APP_VERSION } from '@/constants/app';
import { PlusIcon } from '@/content/components/icons/PlusIcon';

interface WorkspaceExplorerHeaderProps {
  readonly onCreateFolder: () => void;
}

export function WorkspaceExplorerHeader({ onCreateFolder }: WorkspaceExplorerHeaderProps) {
  return (
    <header className="border-b border-slate-200 px-5 pt-5 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            Workspace
          </p>
          <h2 className="mt-1 truncate text-lg font-semibold tracking-normal text-slate-950">
            {APP_NAME}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">Version {APP_VERSION}</p>
        </div>
        <button
          aria-label="Create folder"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white transition hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-slate-300 focus-visible:outline-none"
          type="button"
          onClick={onCreateFolder}
        >
          <PlusIcon />
        </button>
      </div>
    </header>
  );
}
