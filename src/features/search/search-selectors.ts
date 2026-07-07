import type {
  SearchEntityType,
  SearchResponse,
  SearchResult,
  SearchResultGroup,
} from '@/features/search/search-types';

const GROUP_TITLES: Readonly<Record<string, string>> = {
  assignment: 'Assignments',
  conversation: 'Conversations',
  folder: 'Folders',
};

export function groupSearchResults(
  results: readonly SearchResult[],
  query: string,
): SearchResponse {
  const groupsByType = new Map<SearchEntityType, SearchResult[]>();

  for (const result of results) {
    const groupResults = groupsByType.get(result.document.type) ?? [];

    groupResults.push(result);
    groupsByType.set(result.document.type, groupResults);
  }

  const groups: SearchResultGroup[] = [...groupsByType.entries()].map(([type, groupResults]) => ({
    results: groupResults,
    title: GROUP_TITLES[type] ?? type,
    type,
  }));

  return {
    groups,
    query,
    resultCount: results.length,
    searchedAt: new Date().toISOString(),
  };
}

export function createEmptySearchResponse(query = ''): SearchResponse {
  return {
    groups: [],
    query,
    resultCount: 0,
    searchedAt: new Date().toISOString(),
  };
}
