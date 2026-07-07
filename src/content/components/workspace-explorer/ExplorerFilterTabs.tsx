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
    <div className="border-b border-slate-200 px-4 py-3">
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
        'h-8 rounded-md px-3 text-xs font-semibold transition focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none',
        active
          ? 'bg-slate-950 text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
      ].join(' ')}
      role="tab"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
