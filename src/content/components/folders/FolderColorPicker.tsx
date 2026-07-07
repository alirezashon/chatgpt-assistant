import { FOLDER_COLOR_OPTIONS } from '@/content/components/folders/folder-form-options';

interface FolderColorPickerProps {
  readonly color: string;
  readonly inputId: string;
  readonly onChange: (color: string) => void;
}

export function FolderColorPicker({ color, inputId, onChange }: FolderColorPickerProps) {
  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-2 block text-sm font-medium text-slate-800">Folder color</span>
      <div className="flex items-center gap-2">
        {FOLDER_COLOR_OPTIONS.map((option) => (
          <button
            key={option}
            aria-label={`Use color ${option}`}
            aria-pressed={color === option}
            className="h-7 w-7 rounded-full border border-slate-200 transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-slate-300 focus-visible:outline-none aria-pressed:ring-2 aria-pressed:ring-slate-950 aria-pressed:ring-offset-2"
            style={{ backgroundColor: option }}
            type="button"
            onClick={() => {
              onChange(option);
            }}
          />
        ))}
        <input
          aria-label="Custom folder color"
          className="h-8 w-10 rounded-md border border-slate-300 bg-white"
          id={inputId}
          type="color"
          value={color}
          onChange={(event) => {
            onChange(event.currentTarget.value);
          }}
        />
      </div>
    </label>
  );
}
