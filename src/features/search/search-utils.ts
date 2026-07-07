import type { IndexedSearchDocument, SearchDocument } from '@/features/search/search-types';

const COMBINING_MARKS_PATTERN = /\p{Mark}/gu;
const TOKEN_PATTERN = /[\p{Letter}\p{Number}]+/gu;

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/gu, ' ');
}

export function tokenizeSearchText(value: string): readonly string[] {
  const normalizedValue = normalizeSearchText(value);

  return Array.from(normalizedValue.matchAll(TOKEN_PATTERN), (match) => match[0]);
}

export function createIndexedDocument(document: SearchDocument): IndexedSearchDocument {
  const normalizedTitle = normalizeSearchText(document.title);
  const normalizedContent = normalizeSearchText(document.content);
  const normalizedKeywords = document.keywords.map(normalizeSearchText);
  const tokens = uniqueStrings([
    ...tokenizeSearchText(normalizedTitle),
    ...tokenizeSearchText(normalizedContent),
    ...normalizedKeywords.flatMap(tokenizeSearchText),
  ]);

  return {
    ...document,
    normalizedContent,
    normalizedKeywords,
    normalizedTitle,
    tokens,
  };
}

export function createSearchDocumentId(providerId: string, entityId: string): string {
  return `${providerId}:${entityId}`;
}

export function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

export function isSubsequence(query: string, value: string): boolean {
  if (query.length === 0) {
    return false;
  }

  let queryIndex = 0;

  for (const character of value) {
    if (character === query[queryIndex]) {
      queryIndex += 1;
    }

    if (queryIndex === query.length) {
      return true;
    }
  }

  return false;
}

export function boundedEditDistance(
  firstValue: string,
  secondValue: string,
  maxDistance: number,
): number {
  if (Math.abs(firstValue.length - secondValue.length) > maxDistance) {
    return maxDistance + 1;
  }

  const previousRow = Array.from({ length: secondValue.length + 1 }, (_, index) => index);

  for (let firstIndex = 1; firstIndex <= firstValue.length; firstIndex += 1) {
    const currentRow = [firstIndex];
    let rowMinimum = currentRow[0] ?? 0;

    for (let secondIndex = 1; secondIndex <= secondValue.length; secondIndex += 1) {
      const insertion = (currentRow[secondIndex - 1] ?? 0) + 1;
      const deletion = (previousRow[secondIndex] ?? 0) + 1;
      const substitution =
        (previousRow[secondIndex - 1] ?? 0) +
        (firstValue[firstIndex - 1] === secondValue[secondIndex - 1] ? 0 : 1);
      const distance = Math.min(insertion, deletion, substitution);

      currentRow[secondIndex] = distance;
      rowMinimum = Math.min(rowMinimum, distance);
    }

    if (rowMinimum > maxDistance) {
      return maxDistance + 1;
    }

    for (let index = 0; index < currentRow.length; index += 1) {
      previousRow[index] = currentRow[index] ?? maxDistance + 1;
    }
  }

  return previousRow[secondValue.length] ?? maxDistance + 1;
}

export function createIsoTimestamp(): string {
  return new Date().toISOString();
}
