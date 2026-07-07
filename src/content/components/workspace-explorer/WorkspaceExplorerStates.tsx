interface WorkspaceExplorerErrorStateProps {
  readonly syncError: Error | null;
  readonly workspaceError: Error | null;
}

export function WorkspaceExplorerSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-4" aria-label="Loading workspace">
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceExplorerErrorState({
  syncError,
  workspaceError,
}: WorkspaceExplorerErrorStateProps) {
  if (syncError === null && workspaceError === null) {
    return null;
  }

  return (
    <div className="border-b border-red-100 bg-red-50 px-4 py-3" role="alert">
      <p className="text-sm font-semibold text-red-700">Workspace needs attention</p>
      <p className="mt-1 text-xs leading-5 text-red-600">
        {workspaceError?.message ?? syncError?.message ?? 'Workspace data could not be restored.'}
      </p>
    </div>
  );
}
