import { useMemo, useState } from 'react';

import { Button } from '@/content/components/ui/Button';
import { FieldError } from '@/content/components/ui/FieldError';
import { Modal } from '@/content/components/ui/Modal';
import type { Conversation } from '@/features/conversations';

interface RenameConversationDialogProps {
  readonly conversationId: string;
  readonly conversations: readonly Conversation[];
  readonly onClose: () => void;
  readonly onRename: (conversationId: string, title: string) => void;
}

export function RenameConversationDialog({
  conversationId,
  conversations,
  onClose,
  onRename,
}: RenameConversationDialogProps) {
  const conversation = useMemo(
    () => conversations.find((candidate) => candidate.id === conversationId) ?? null,
    [conversationId, conversations],
  );
  const [title, setTitle] = useState(conversation?.title ?? '');
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal title="Rename Conversation" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();

          try {
            onRename(conversationId, title);
          } catch (renameError) {
            setError(renameError instanceof Error ? renameError.message : 'Rename failed.');
          }
        }}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Conversation title</span>
          <input
            autoFocus
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
            value={title}
            onChange={(event) => {
              setError(null);
              setTitle(event.currentTarget.value);
            }}
          />
        </label>
        <FieldError>{error}</FieldError>
        <footer className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </footer>
      </form>
    </Modal>
  );
}
