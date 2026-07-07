interface ActionToolbarProps {
  readonly selectedCount: number;
  readonly onClear: () => void;
  readonly onExecute: (actionId: string) => void;
}

export function ActionToolbar({ onClear, onExecute, selectedCount }: ActionToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-sm font-semibold text-slate-700">
          {selectedCount} selected
        </span>
        <ToolbarButton label="Move" onClick={() => onExecute('move-to-folder')} />
        <ToolbarButton label="Favorite" onClick={() => onExecute('toggle-favorite')} />
        <ToolbarButton label="Export" onClick={() => onExecute('export-conversation')} />
        <ToolbarButton label="Remove" onClick={() => onExecute('remove-from-folder')} />
        <ToolbarButton label="Clear" onClick={onClear} />
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  readonly label: string;
  readonly onClick: () => void;
}

function ToolbarButton({ label, onClick }: ToolbarButtonProps) {
  return (
    <button
      className="h-8 rounded-md px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
