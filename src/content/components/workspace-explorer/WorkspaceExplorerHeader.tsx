import { APP_NAME, APP_VERSION } from '@/constants/app';
import { PlusIcon } from '@/content/components/icons/PlusIcon';

interface WorkspaceExplorerHeaderProps {
  readonly onCreateFolder: () => void;
}

export function WorkspaceExplorerHeader({ onCreateFolder }: WorkspaceExplorerHeaderProps) {
  return (
    <header className="border-b border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#ecfdf5_56%,#fff7ed_100%)] px-5 pt-5 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Workspace
          </p>
          <h2 className="mt-1 truncate text-lg font-semibold tracking-normal text-slate-950">
            {APP_NAME}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Version {APP_VERSION}</p>
        </div>
        <button
          aria-label="Create folder"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white shadow-sm transition hover:bg-emerald-800 focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:outline-none"
          type="button"
          onClick={onCreateFolder}
        >
          <PlusIcon />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <GuideItem label="Create" text="Add folders for projects." />
        <GuideItem label="Move" text="Put the current chat in a folder." />
        <GuideItem label="Act" text="Track next steps in Tasks." />
      </div>
    </header>
  );
}

interface GuideItemProps {
  readonly label: string;
  readonly text: string;
}

function GuideItem({ label, text }: GuideItemProps) {
  return (
    <div className="rounded-md border border-white/80 bg-white/80 p-2 shadow-sm">
      <p className="text-xs font-bold text-slate-950">{label}</p>
      <p className="mt-1 text-[11px] leading-4 text-slate-600">{text}</p>
    </div>
  );
}
