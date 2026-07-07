import type { SearchConfig } from '@/features/search/search-config';
import type {
  IndexedSearchDocument,
  SearchHistoryItem,
  SearchSuggestion,
} from '@/features/search/search-types';
import { normalizeSearchText } from '@/features/search/search-utils';

export function createSearchSuggestions(
  query: string,
  documents: readonly IndexedSearchDocument[],
  history: readonly SearchHistoryItem[],
  config: SearchConfig,
): readonly SearchSuggestion[] {
  const normalizedQuery = normalizeSearchText(query);
  const suggestions: SearchSuggestion[] = [];

  for (const historyItem of history) {
    if (
      normalizedQuery.length === 0 ||
      normalizeSearchText(historyItem.query).startsWith(normalizedQuery)
    ) {
      suggestions.push({
        id: historyItem.id,
        label: historyItem.query,
        source: 'history',
        type: 'history',
      });
    }
  }

  for (const document of documents) {
    if (
      normalizedQuery.length === 0 ||
      document.normalizedTitle.startsWith(normalizedQuery) ||
      document.tokens.some((token) => token.startsWith(normalizedQuery))
    ) {
      suggestions.push({
        id: document.id,
        label: document.title,
        source: 'document',
        type: document.type,
      });
    }
  }

  return dedupeSuggestions(suggestions).slice(0, config.suggestionLimit);
}

function dedupeSuggestions(suggestions: readonly SearchSuggestion[]): readonly SearchSuggestion[] {
  const seenLabels = new Set<string>();
  const uniqueSuggestions: SearchSuggestion[] = [];

  for (const suggestion of suggestions) {
    const normalizedLabel = normalizeSearchText(suggestion.label);

    if (seenLabels.has(normalizedLabel)) {
      continue;
    }

    seenLabels.add(normalizedLabel);
    uniqueSuggestions.push(suggestion);
  }

  return uniqueSuggestions;
}
