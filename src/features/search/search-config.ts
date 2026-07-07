export interface SearchConfig {
  readonly cacheSize: number;
  readonly debounceMs: number;
  readonly defaultLimit: number;
  readonly historyLimit: number;
  readonly suggestionLimit: number;
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  cacheSize: 50,
  debounceMs: 120,
  defaultLimit: 50,
  historyLimit: 12,
  suggestionLimit: 8,
};
