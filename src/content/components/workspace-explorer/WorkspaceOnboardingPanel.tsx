interface WorkspaceOnboardingPanelProps {
  readonly hasFolders: boolean;
  readonly hasConversation: boolean;
  readonly onCreateFolder: () => void;
  readonly onDismiss: () => void;
}

export function WorkspaceOnboardingPanel({
  hasConversation,
  hasFolders,
  onCreateFolder,
  onDismiss,
}: WorkspaceOnboardingPanelProps) {
  return (
    <section className="border-b border-slate-200 bg-slate-50 px-5 py-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Quick start
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-950">
              Organize ChatGPT without signing in
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Create a folder, assign the current conversation, then search or export your local
              workspace.
            </p>
          </div>
          <button
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
            type="button"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>

        <ol className="mt-4 grid gap-2 text-xs text-slate-700">
          <StepItem complete={hasFolders} label="Create your first folder" />
          <StepItem complete={hasConversation} label="Open or detect a ChatGPT conversation" />
          <StepItem complete={false} label="Move the conversation into a folder" />
        </ol>

        {!hasFolders ? (
          <button
            className="mt-4 h-9 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-slate-300 focus-visible:outline-none"
            type="button"
            onClick={onCreateFolder}
          >
            Start with a Folder
          </button>
        ) : null}
      </div>
    </section>
  );
}

interface StepItemProps {
  readonly complete: boolean;
  readonly label: string;
}

function StepItem({ complete, label }: StepItemProps) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-label={complete ? 'Complete' : 'Incomplete'}
        className={[
          'inline-flex size-4 items-center justify-center rounded-full border',
          complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={['size-1.5 rounded-full', complete ? 'bg-emerald-500' : 'bg-slate-300'].join(
            ' ',
          )}
        />
      </span>
      <span>{label}</span>
    </li>
  );
}
