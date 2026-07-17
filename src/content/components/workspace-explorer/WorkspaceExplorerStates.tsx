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

  const workspaceIssue = workspaceError ?? syncError;
  const contextInvalidated =
    workspaceIssue?.message.includes('Extension was reloaded') === true ||
    workspaceIssue?.message.includes('Extension context invalidated') === true;

  return (
    <div
      className={[
        'grid gap-2 border-b px-4 py-3',
        contextInvalidated ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50',
      ].join(' ')}
      role="alert"
    >
      {conversationError !== null ? (
        <ErrorNotice
          description="ChatGPT Workspace could not read this page's conversation structure. Refresh the ChatGPT tab, open an existing conversation, or keep using folders while detection recovers."
          detail={conversationError.message}
          tone="error"
          title="Conversation detection needs attention"
        />
      ) : null}
      {workspaceIssue !== null ? (
        <ErrorNotice
          description={
            contextInvalidated
              ? 'The extension was reloaded while this ChatGPT tab was still open. Refresh this page once and the workspace will reconnect.'
              : workspaceIssue.message
          }
          tone={contextInvalidated ? 'warning' : 'error'}
          title={contextInvalidated ? 'Refresh this ChatGPT tab' : 'Workspace needs attention'}
        />
      ) : null}
    </div>
  );
}

interface ErrorNoticeProps {
  readonly description: string;
  readonly detail?: string;
  readonly tone: 'error' | 'warning';
  readonly title: string;
}

function ErrorNotice({ description, detail, title, tone }: ErrorNoticeProps) {
  const titleClassName = tone === 'warning' ? 'text-amber-800' : 'text-red-700';
  const descriptionClassName = tone === 'warning' ? 'text-amber-700' : 'text-red-600';
  const detailClassName = tone === 'warning' ? 'text-amber-600' : 'text-red-500';

  return (
    <div>
      <p className={['text-sm font-semibold', titleClassName].join(' ')}>{title}</p>
      <p className={['mt-1 text-xs leading-5', descriptionClassName].join(' ')}>{description}</p>
      {detail === undefined ? null : (
        <p className={['mt-1 text-xs leading-5', detailClassName].join(' ')}>Details: {detail}</p>
      )}
    </div>
  );
}
