import type { IndexedSearchDocument, SearchResult } from '@/features/search/search-types';
import {
  boundedEditDistance,
  isSubsequence,
  normalizeSearchText,
  tokenizeSearchText,
} from '@/features/search/search-utils';

const ENTITY_TYPE_BOOST: Readonly<Record<string, number>> = {
  assignment: 30,
  conversation: 40,
  folder: 70,
};

export function rankSearchDocuments(
  documents: readonly IndexedSearchDocument[],
  query: string,
): readonly SearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenizeSearchText(normalizedQuery);

  if (normalizedQuery.length === 0 || queryTokens.length === 0) {
    return [];
  }

  return documents
    .map((document) => scoreDocument(document, normalizedQuery, queryTokens))
    .filter((result): result is SearchResult => result !== null)
    .sort((firstResult, secondResult) => {
      if (firstResult.score !== secondResult.score) {
        return secondResult.score - firstResult.score;
      }

      return secondResult.document.updatedAt.localeCompare(firstResult.document.updatedAt);
    });
}

function scoreDocument(
  document: IndexedSearchDocument,
  normalizedQuery: string,
  queryTokens: readonly string[],
): SearchResult | null {
  const matchedTerms = new Set<string>();
  let score = 0;

  if (document.normalizedTitle === normalizedQuery) {
    score += 1000;
    matchedTerms.add(normalizedQuery);
  }

  if (document.normalizedTitle.startsWith(normalizedQuery)) {
    score += 700;
    matchedTerms.add(normalizedQuery);
  }

  if (document.normalizedTitle.includes(normalizedQuery)) {
    score += 500;
    matchedTerms.add(normalizedQuery);
  }

  if (document.normalizedContent.includes(normalizedQuery)) {
    score += 250;
    matchedTerms.add(normalizedQuery);
  }

  for (const token of queryTokens) {
    score += scoreToken(document, token, matchedTerms);
  }

  score += ENTITY_TYPE_BOOST[document.type] ?? 10;
  score += scoreRecency(document.updatedAt);

  if (score <= 0 || matchedTerms.size === 0) {
    return null;
  }

  return {
    document,
    matchedTerms: [...matchedTerms],
    score,
  };
}

function scoreToken(
  document: IndexedSearchDocument,
  token: string,
  matchedTerms: Set<string>,
): number {
  let score = 0;

  for (const documentToken of document.tokens) {
    if (documentToken === token) {
      score += 160;
      matchedTerms.add(token);
      continue;
    }

    if (documentToken.startsWith(token)) {
      score += 110;
      matchedTerms.add(token);
      continue;
    }

    if (documentToken.includes(token)) {
      score += 70;
      matchedTerms.add(token);
      continue;
    }

    if (token.length >= 3 && isSubsequence(token, documentToken)) {
      score += 35;
      matchedTerms.add(token);
      continue;
    }

    if (token.length >= 4 && boundedEditDistance(token, documentToken, 2) <= 2) {
      score += 25;
      matchedTerms.add(token);
    }
  }

  return score;
}

function scoreRecency(updatedAt: string): number {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  const ageMs = Date.now() - timestamp;
  const ageDays = ageMs / 86_400_000;

  if (ageDays <= 1) {
    return 40;
  }

  if (ageDays <= 7) {
    return 25;
  }

  if (ageDays <= 30) {
    return 10;
  }

  return 0;
}
