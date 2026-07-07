import { FOLDER_ICON_OPTIONS } from '@/content/components/folders/folder-form-options';
import type { FolderIconName } from '@/content/components/folders/folder-ui-types';
import { FolderGlyph } from '@/content/components/icons/FolderGlyph';

interface FolderIconPickerProps {
  readonly icon: FolderIconName;
  readonly onChange: (icon: FolderIconName) => void;
}

export function FolderIconPicker({ icon, onChange }: FolderIconPickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-800">Folder icon</legend>
      <div className="flex gap-2">
        {FOLDER_ICON_OPTIONS.map((option) => (
          <button
            key={option}
            aria-label={`Use ${option} icon`}
            aria-pressed={icon === option}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none aria-pressed:border-slate-950 aria-pressed:bg-slate-950 aria-pressed:text-white"
            type="button"
            onClick={() => {
              onChange(option);
            }}
          >
            <FolderGlyph icon={option} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
