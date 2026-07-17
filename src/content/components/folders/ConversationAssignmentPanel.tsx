import type { ConversationAssignment } from '@/features/assignments';
import type { Conversation } from '@/features/conversations';
import type { Folder } from '@/shared/types';

interface ConversationAssignmentPanelProps {
  readonly activeConversation: Conversation | null;
  readonly assignment: ConversationAssignment | null;
  readonly folders: readonly Folder[];
  readonly isSaving: boolean;
  readonly onAssign: (folderId: string) => void;
  readonly onRemove: () => void;
}

export function ConversationAssignmentPanel({
  activeConversation,
  assignment,
  folders,
  isSaving,
  onAssign,
  onRemove,
}: ConversationAssignmentPanelProps) {
  const selectedFolder = folders.find((folder) => folder.id === assignment?.folderId) ?? null;

  return (
    <section className="border-b border-slate-200 px-6 pb-4">
      <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
          Step 2 - Move current chat
        </p>
        <h4 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
          {activeConversation?.title ?? 'No conversation detected'}
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          {selectedFolder === null
            ? 'Choose a folder below to organize this chat.'
            : `This chat is in ${selectedFolder.name}.`}
        </p>

        <div className="mt-3 flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Move conversation to folder</span>
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={activeConversation === null || folders.length === 0 || isSaving}
              value={assignment?.folderId ?? ''}
              onChange={(event) => {
                if (event.currentTarget.value.length > 0) {
                  onAssign(event.currentTarget.value);
                }
              }}
            >
              <option value="">Move to Folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>

          <button
            className="h-9 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={activeConversation === null || assignment === null || isSaving}
            type="button"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </section>
  );
}
