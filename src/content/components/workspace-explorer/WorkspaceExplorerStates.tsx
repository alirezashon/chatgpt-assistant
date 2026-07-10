interface WorkspaceExplorerErrorStateProps {
  readonly conversationError: Error | null;
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
  conversationError,
  syncError,
  workspaceError,
}: WorkspaceExplorerErrorStateProps) {
  if (conversationError === null && syncError === null && workspaceError === null) {
    return null;
  }

  return (
    <div className="grid gap-2 border-b border-red-100 bg-red-50 px-4 py-3" role="alert">
      {conversationError !== null ? (
        <ErrorNotice
          description="ChatGPT Workspace could not read this page's conversation structure. Refresh the ChatGPT tab, open an existing conversation, or keep using folders while detection recovers."
          detail={conversationError.message}
          title="Conversation detection needs attention"
        />
      ) : null}
      {workspaceError !== null || syncError !== null ? (
        <ErrorNotice
          description={
            workspaceError?.message ?? syncError?.message ?? 'Workspace data could not be restored.'
          }
          title="Workspace needs attention"
        />
      ) : null}
    </div>
  );
}

interface ErrorNoticeProps {
  readonly description: string;
  readonly detail?: string;
  readonly title: string;
}

function ErrorNotice({ description, detail, title }: ErrorNoticeProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-red-700">{title}</p>
      <p className="mt-1 text-xs leading-5 text-red-600">{description}</p>
      {detail === undefined ? null : (
        <p className="mt-1 text-xs leading-5 text-red-500">Details: {detail}</p>
      )}
    </div>
  );
}
