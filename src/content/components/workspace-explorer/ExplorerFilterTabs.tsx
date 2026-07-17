import type { ExplorerFilter } from '@/content/components/workspace-explorer/workspace-explorer-types';

interface ExplorerFilterTabsProps {
  readonly activeFilter: ExplorerFilter;
  readonly selectedFolderName: string | null;
  readonly onSelect: (filter: ExplorerFilter) => void;
}

const BASE_FILTERS: readonly { readonly label: string; readonly value: ExplorerFilter }[] = [
  {
    label: 'All',
    value: 'all',
  },
  {
    label: 'Unassigned',
    value: 'unassigned',
  },
  {
    label: 'Favorites',
    value: 'favorites',
  },
  {
    label: 'Recent',
    value: 'recent',
  },
];

export function ExplorerFilterTabs({
  activeFilter,
  onSelect,
  selectedFolderName,
}: ExplorerFilterTabsProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        Filter conversations
      </p>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Conversation filters">
        {selectedFolderName === null ? null : (
          <FilterButton
            active={activeFilter === 'folder'}
            label={selectedFolderName}
            onClick={() => {
              onSelect('folder');
            }}
          />
        )}
        {BASE_FILTERS.map((filter) => (
          <FilterButton
            key={filter.value}
            active={activeFilter === filter.value}
            label={filter.label}
            onClick={() => {
              onSelect(filter.value);
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface FilterButtonProps {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}

function FilterButton({ active, label, onClick }: FilterButtonProps) {
  return (
    <button
      aria-selected={active}
      className={[
        'h-8 rounded-md border px-3 text-xs font-semibold transition focus-visible:ring-4 focus-visible:ring-emerald-100 focus-visible:outline-none',
        active
          ? 'border-slate-950 bg-slate-950 text-white'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900',
      ].join(' ')}
      role="tab"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
