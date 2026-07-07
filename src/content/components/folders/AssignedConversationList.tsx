import type { Conversation } from '@/features/conversations';

interface AssignedConversationListProps {
  readonly conversations: readonly Conversation[];
}

export function AssignedConversationList({ conversations }: AssignedConversationListProps) {
  if (conversations.length === 0) {
    return (
      <p className="ml-12 rounded-md px-3 py-2 text-xs text-slate-400">
        No conversations assigned yet.
      </p>
    );
  }

  return (
    <ul className="ml-12 mt-1 space-y-1 border-l border-slate-200 pl-3">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <button
            className="line-clamp-2 w-full rounded-md px-2 py-1.5 text-left text-xs leading-5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-4 focus-visible:ring-slate-100 focus-visible:outline-none"
            type="button"
          >
            {conversation.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
