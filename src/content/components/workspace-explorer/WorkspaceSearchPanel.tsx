import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { SearchBar } from '@/content/components/search/SearchBar';
import type { SearchResult, SearchSuggestion } from '@/features/search';
import { useSearch } from '@/features/search';

export function WorkspaceSearchPanel() {
  const search = useSearch();
  const panelRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const isSearching = search.status === 'searching' || search.status === 'indexing';
  const hasQuery = query.trim().length > 0;
  const visibleSuggestions = useMemo(
    () => search.suggestions.filter((suggestion) => suggestion.label.length > 0),
    [search.suggestions],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void search.actions.search(query);
    }, search.debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query, search.actions, search.debounceMs]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    const items = getSearchOptions(panelRef.current);

    if (items.length === 0) {
      return;
    }

    event.preventDefault();

    const currentIndex = items.findIndex((item) => item === document.activeElement);
    const nextIndex =
      event.key === 'ArrowDown'
        ? Math.min(currentIndex + 1, items.length - 1)
        : Math.max(currentIndex - 1, 0);

    items[nextIndex]?.focus();
  }, []);

  return (
    <section ref={panelRef} className="border-b border-slate-200" onKeyDown={handleKeyDown}>
      <SearchBar
        isLoading={isSearching}
        query={query}
        onChange={setQuery}
        onSubmit={() => {
          void search.actions.recordSearch(query);
        }}
      />

      {search.error === null ? null : (
        <div className="px-4 pb-3 text-xs text-red-600" role="alert">
          {search.error.message}
        </div>
      )}

      {hasQuery ? (
        <SearchResults
          groups={search.response.groups}
          resultCount={search.response.resultCount}
          onOpenResult={() => {
            void search.actions.recordSearch(query);
          }}
        />
      ) : (
        <SearchSuggestions
          suggestions={visibleSuggestions}
          onClearHistory={() => {
            void search.actions.clearHistory();
          }}
          onSelect={(suggestion) => {
            setQuery(suggestion.label);
            void search.actions.recordSearch(suggestion.label);
          }}
        />
      )}
    </section>
  );
}

interface SearchResultsProps {
  readonly groups: readonly {
    readonly results: readonly SearchResult[];
    readonly title: string;
  }[];
  readonly resultCount: number;
  readonly onOpenResult: () => void;
}

function SearchResults({ groups, onOpenResult, resultCount }: SearchResultsProps) {
  if (resultCount === 0) {
    return (
      <div className="px-4 pb-4">
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
          No search results.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-72 overflow-y-auto px-4 pb-4" aria-label="Search results">
      {groups.map((group) => (
        <section key={group.title} className="mb-4 last:mb-0">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            {group.title}
          </h3>
          <ul className="space-y-1">
            {group.results.map((result) => (
              <SearchResultItem
                key={result.document.id}
                result={result}
                onOpenResult={onOpenResult}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

interface SearchResultItemProps {
  readonly result: SearchResult;
  readonly onOpenResult: () => void;
}

function SearchResultItem({ onOpenResult, result }: SearchResultItemProps) {
  const content = (
    <>
      <span className="block truncate text-sm font-semibold text-slate-900">
        {result.document.title}
      </span>
      <span className="mt-1 block truncate text-xs text-slate-500">
        {result.document.type} / score {Math.round(result.score)}
      </span>
    </>
  );

  if (result.document.url !== undefined) {
    return (
      <li>
        <a
          className="block rounded-lg px-3 py-2 transition hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
          data-search-option="true"
          href={result.document.url}
          onClick={onOpenResult}
        >
          {content}
        </a>
      </li>
    );
  }

  return (
    <li>
      <div className="rounded-lg px-3 py-2 text-left">{content}</div>
    </li>
  );
}

interface SearchSuggestionsProps {
  readonly suggestions: readonly SearchSuggestion[];
  readonly onClearHistory: () => void;
  readonly onSelect: (suggestion: SearchSuggestion) => void;
}

function SearchSuggestions({ onClearHistory, onSelect, suggestions }: SearchSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  const hasHistory = suggestions.some((suggestion) => suggestion.type === 'history');

  return (
    <div className="px-4 pb-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Suggestions
        </h3>
        {hasHistory ? (
          <button
            className="text-xs font-medium text-slate-400 transition hover:text-slate-700 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
            type="button"
            onClick={onClearHistory}
          >
            Clear history
          </button>
        ) : null}
      </div>
      <ul className="flex flex-wrap gap-1" aria-label="Search suggestions">
        {suggestions.map((suggestion) => (
          <li key={`${suggestion.type}:${suggestion.id}`}>
            <button
              className="h-8 rounded-md bg-slate-100 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-950 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
              data-search-option="true"
              type="button"
              onClick={() => {
                onSelect(suggestion);
              }}
            >
              {suggestion.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getSearchOptions(container: HTMLElement | null): readonly HTMLElement[] {
  if (container === null) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>('[data-search-option="true"]'));
}
