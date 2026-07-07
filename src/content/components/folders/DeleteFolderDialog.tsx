import { FolderGlyph } from '@/content/components/icons/FolderGlyph';
import { Button } from '@/content/components/ui/Button';
import { FieldError } from '@/content/components/ui/FieldError';
import { Modal } from '@/content/components/ui/Modal';
import type { Folder } from '@/shared/types';

interface DeleteFolderDialogProps {
  readonly errorMessage: string | null;
  readonly folder: Folder;
  readonly isDeleting: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
}

export function DeleteFolderDialog({
  errorMessage,
  folder,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteFolderDialogProps) {
  return (
    <Modal title="Delete folder?" onClose={onClose}>
      <div className="mb-4 flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: folder.color }}
        >
          <FolderGlyph icon={folder.icon} />
        </span>
        <p className="text-sm leading-6 text-slate-600">
          This will remove "{folder.name}" from your local workspace.
        </p>
      </div>

      <FieldError>{errorMessage}</FieldError>

      <footer className="mt-6 flex justify-end gap-2">
        <Button disabled={isDeleting} variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={isDeleting}
          variant="danger"
          onClick={() => {
            void onConfirm();
          }}
        >
          Delete
        </Button>
      </footer>
    </Modal>
  );
}
