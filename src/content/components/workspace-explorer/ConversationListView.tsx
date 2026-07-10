import { useRef } from 'react';

import type {
  ExplorerConversationItem,
  ExplorerFilter,
} from '@/content/components/workspace-explorer/workspace-explorer-types';
import { formatConversationTime } from '@/content/components/workspace-explorer/workspace-explorer-utils';

interface ConversationListViewProps {
  readonly conversations: readonly ExplorerConversationItem[];
  readonly filter: ExplorerFilter;
  readonly selectedConversationIds: ReadonlySet<string>;
  readonly selectedFolderName: string | null;
  readonly onOpenContextMenu: (conversationId: string, x: number, y: number) => void;
  readonly onRangeSelect: (conversationIds: readonly string[]) => void;
  readonly onToggleSelection: (conversationId: string) => void;
}

export function ConversationListView({
  conversations,
  filter,
  onOpenContextMenu,
  onRangeSelect,
  onToggleSelection,
  selectedConversationIds,
  selectedFolderName,
}: ConversationListViewProps) {
  const selectionAnchorRef = useRef<string | null>(null);
  const conversationIds = conversations.map((conversation) => conversation.conversation.id);

  const handleSelectionChange = (conversationId: string, index: number, shiftKey: boolean) => {
    if (shiftKey && selectionAnchorRef.current !== null) {
      const anchorIndex = conversationIds.indexOf(selectionAnchorRef.current);

      if (anchorIndex >= 0) {
        const start = Math.min(anchorIndex, index);
        const end = Math.max(anchorIndex, index);

        onRangeSelect(conversationIds.slice(start, end + 1));
        return;
      }
    }

    selectionAnchorRef.current = conversationId;
    onToggleSelection(conversationId);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col px-4 py-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Conversations
        </h3>
        <span className="text-xs font-medium text-slate-400">{conversations.length}</span>
      </div>

      {conversations.length === 0 ? (
        <ConversationEmptyState filter={filter} selectedFolderName={selectedFolderName} />
      ) : (
        <ul className="space-y-1" aria-label="Conversations">
          {conversations.map((item, index) => (
            <ConversationListItem
              key={item.conversation.id}
              index={index}
              isSelected={selectedConversationIds.has(item.conversation.id)}
              item={item}
              onOpenContextMenu={onOpenContextMenu}
              onSelectionChange={handleSelectionChange}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface ConversationListItemProps {
  readonly index: number;
  readonly isSelected: boolean;
  readonly item: ExplorerConversationItem;
  readonly onOpenContextMenu: (conversationId: string, x: number, y: number) => void;
  readonly onSelectionChange: (conversationId: string, index: number, shiftKey: boolean) => void;
}

function ConversationListItem({
  index,
  isSelected,
  item,
  onOpenContextMenu,
  onSelectionChange,
}: ConversationListItemProps) {
  return (
    <li>
      <div
        aria-current={item.isActive ? 'page' : undefined}
        className={[
          'group rounded-lg border px-3 py-3 transition focus-within:ring-4 focus-within:ring-slate-200',
          item.isActive
            ? 'border-slate-300 bg-slate-100 shadow-sm'
            : isSelected
              ? 'border-slate-300 bg-slate-50'
              : 'border-transparent hover:border-slate-200 hover:bg-slate-50',
        ].join(' ')}
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenContextMenu(item.conversation.id, event.clientX, event.clientY);
        }}
      >
        <div className="flex items-start gap-2">
          <input
            aria-label={`Select ${item.conversation.title}`}
            checked={isSelected}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-950 focus:ring-4 focus:ring-slate-200"
            type="checkbox"
            onChange={(event) => {
              const shiftKey =
                event.nativeEvent instanceof MouseEvent ? event.nativeEvent.shiftKey : false;

              onSelectionChange(item.conversation.id, index, shiftKey);
            }}
          />
          <span
            aria-hidden="true"
            className={[
              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
              item.isActive ? 'bg-emerald-500' : 'bg-slate-300',
            ].join(' ')}
          />
          <a
            className="min-w-0 flex-1 rounded-sm focus-visible:outline-none"
            href={item.conversation.url}
            onKeyDown={(event) => {
              if (event.key === 'ContextMenu') {
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                onOpenContextMenu(item.conversation.id, rect.left + 24, rect.top + 24);
              }
            }}
          >
            <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
              {item.isFavorite ? <span aria-label="Favorite">* </span> : null}
              {item.conversation.title}
            </h4>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="truncate">
                {item.folder === null ? 'Unassigned' : item.folder.name}
              </span>
              <span aria-hidden="true">/</span>
              <time dateTime={item.conversation.updatedAt}>
                {formatConversationTime(item.conversation.updatedAt)}
              </time>
              <span className="rounded-full bg-white px-2 py-0.5 font-medium text-slate-400 shadow-sm">
                Metadata
              </span>
            </div>
          </a>
        </div>
      </div>
    </li>
  );
}

interface ConversationEmptyStateProps {
  readonly filter: ExplorerFilter;
  readonly selectedFolderName: string | null;
}

function ConversationEmptyState({ filter, selectedFolderName }: ConversationEmptyStateProps) {
  const content = getEmptyStateContent(filter, selectedFolderName);

  return (
    <div className="flex min-h-40 flex-1 flex-col justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6">
      <p className="text-sm font-semibold text-slate-800">{content.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{content.description}</p>
      {content.steps.length > 0 ? (
        <ul className="mt-4 grid gap-2 text-xs leading-5 text-slate-600">
          {content.steps.map((step) => (
            <li key={step} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-500" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface EmptyStateContent {
  readonly description: string;
  readonly steps: readonly string[];
  readonly title: string;
}

function getEmptyStateContent(
  filter: ExplorerFilter,
  selectedFolderName: string | null,
): EmptyStateContent {
  if (filter === 'folder') {
    if (selectedFolderName === null) {
      return {
        description: 'Pick a folder from the tree to see its saved conversations.',
        steps: [],
        title: 'Select a folder to view conversations.',
      };
    }

    return {
      description: 'Move the current conversation into this folder when it is detected.',
      steps: ['Open a ChatGPT conversation.', 'Use the current conversation dropdown above.'],
      title: `${selectedFolderName} has no conversations yet.`,
    };
  }

  if (filter === 'unassigned') {
    return {
      description: 'Every detected conversation is already assigned to a folder.',
      steps: [],
      title: 'No unassigned conversations.',
    };
  }

  if (filter === 'favorites') {
    return {
      description:
        'Favorite conversations will appear here after you mark them from the action menu.',
      steps: [],
      title: 'No favorite conversations yet.',
    };
  }

  return {
    description:
      'ChatGPT Workspace could not find a conversation link on this page. This is normal on a new chat or when ChatGPT changes its sidebar markup.',
    steps: [
      'Open an existing ChatGPT conversation from the left sidebar.',
      'Refresh the ChatGPT tab if the conversation is already open.',
      'Keep using local folders; sign-in is not required for this check.',
    ],
    title: 'No conversations detected yet.',
  };
}
