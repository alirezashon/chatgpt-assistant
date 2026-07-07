import { useId, useState } from 'react';

import { FolderColorPicker } from '@/content/components/folders/FolderColorPicker';
import { FolderIconPicker } from '@/content/components/folders/FolderIconPicker';
import type {
  FolderDialogState,
  FolderIconName,
} from '@/content/components/folders/folder-ui-types';
import { Button } from '@/content/components/ui/Button';
import { FieldError } from '@/content/components/ui/FieldError';
import { Modal } from '@/content/components/ui/Modal';
import { TextInput } from '@/content/components/ui/TextInput';
import { DEFAULT_FOLDER_COLOR, DEFAULT_FOLDER_ICON } from '@/features/folders';

export interface FolderFormValues {
  readonly color: string;
  readonly icon: FolderIconName;
  readonly name: string;
}

interface FolderDialogProps {
  readonly errorMessage: string | null;
  readonly isSubmitting: boolean;
  readonly state: FolderDialogState;
  readonly onClose: () => void;
  readonly onSubmit: (values: FolderFormValues) => Promise<void>;
}

export function FolderDialog({
  errorMessage,
  isSubmitting,
  onClose,
  onSubmit,
  state,
}: FolderDialogProps) {
  const nameInputId = useId();
  const colorInputId = useId();
  const initialValues = getInitialValues(state);
  const [name, setName] = useState(initialValues.name);
  const [color, setColor] = useState(initialValues.color);
  const [icon, setIcon] = useState<FolderIconName>(initialValues.icon);

  const title = state.mode === 'create' ? 'New Folder' : 'Rename Folder';
  const actionLabel = state.mode === 'create' ? 'Create Folder' : 'Save Changes';

  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit({
            color,
            icon,
            name,
          });
        }}
      >
        <div className="space-y-5">
          <TextInput
            autoFocus
            id={nameInputId}
            label="Folder name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.currentTarget.value);
            }}
          />

          <FolderColorPicker color={color} inputId={colorInputId} onChange={setColor} />
          <FolderIconPicker icon={icon} onChange={setIcon} />
          <FieldError>{errorMessage}</FieldError>
        </div>

        <footer className="mt-6 flex justify-end gap-2">
          <Button disabled={isSubmitting} variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {actionLabel}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}

function getInitialValues(state: FolderDialogState): FolderFormValues {
  return {
    color: state.folder?.color ?? DEFAULT_FOLDER_COLOR,
    icon: toFolderIconName(state.folder?.icon ?? DEFAULT_FOLDER_ICON),
    name: state.folder?.name ?? '',
  };
}

function toFolderIconName(icon: string): FolderIconName {
  if (icon === 'briefcase' || icon === 'bookmark' || icon === 'folder') {
    return icon;
  }

  return 'folder';
}
