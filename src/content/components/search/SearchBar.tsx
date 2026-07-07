import { useEffect, useRef } from 'react';

import { SearchIcon } from '@/content/components/icons/SearchIcon';

interface SearchBarProps {
  readonly isLoading: boolean;
  readonly placeholder?: string;
  readonly query: string;
  readonly onChange: (query: string) => void;
  readonly onSubmit: () => void;
}

export function SearchBar({
  isLoading,
  onChange,
  onSubmit,
  placeholder = 'Search workspace',
  query,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <form
      className="px-4 py-3"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          aria-label={placeholder}
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pr-16 pl-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
          placeholder={`${placeholder}...`}
          type="search"
          value={query}
          onChange={(event) => {
            onChange(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onChange('');
            }
          }}
        />
        <span className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
          {isLoading ? (
            <span
              aria-label="Searching"
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
              role="status"
            />
          ) : null}
          {query.length > 0 ? (
            <button
              aria-label="Clear search"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-slate-800 focus-visible:ring-4 focus-visible:ring-slate-200 focus-visible:outline-none"
              type="button"
              onClick={() => {
                onChange('');
              }}
            >
              x
            </button>
          ) : null}
        </span>
      </label>
    </form>
  );
}
