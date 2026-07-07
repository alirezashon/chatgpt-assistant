interface SearchInputProps {
  readonly placeholder?: string;
}

export function SearchInput({ placeholder = 'Search folders' }: SearchInputProps) {
  return (
    <label className="block px-6 pb-4">
      <span className="sr-only">{placeholder}</span>
      <input
        className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
        disabled
        placeholder={`${placeholder}...`}
        type="search"
      />
    </label>
  );
}
