import type { WorkspaceRuntimeState } from '@/app/workspace';
import type { EntityId, ISODateTimeString } from '@/shared/types';

export type SearchEntityType =
  'ai-metadata' | 'assignment' | 'conversation' | 'favorite' | 'folder' | 'note' | 'tag';

export type SearchStatus = 'error' | 'idle' | 'indexing' | 'ready' | 'searching';

export interface SearchDocument {
  readonly content: string;
  readonly entityId: EntityId;
  readonly id: EntityId;
  readonly keywords: readonly string[];
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
  readonly providerId: string;
  readonly title: string;
  readonly type: SearchEntityType;
  readonly updatedAt: ISODateTimeString;
  readonly url?: string;
}

export interface IndexedSearchDocument extends SearchDocument {
  readonly normalizedContent: string;
  readonly normalizedKeywords: readonly string[];
  readonly normalizedTitle: string;
  readonly tokens: readonly string[];
}

export interface SearchProviderContext {
  readonly workspace: WorkspaceRuntimeState;
}

export interface SearchProvider {
  readonly id: string;
  readonly type: SearchEntityType;
  getDocuments(context: SearchProviderContext): readonly SearchDocument[];
}

export interface SearchQuery {
  readonly limit?: number;
  readonly text: string;
}

export interface SearchResult {
  readonly document: SearchDocument;
  readonly matchedTerms: readonly string[];
  readonly score: number;
}

export interface SearchResultGroup {
  readonly results: readonly SearchResult[];
  readonly title: string;
  readonly type: SearchEntityType;
}

export interface SearchResponse {
  readonly groups: readonly SearchResultGroup[];
  readonly query: string;
  readonly resultCount: number;
  readonly searchedAt: ISODateTimeString;
}

export interface SearchHistoryItem {
  readonly createdAt: ISODateTimeString;
  readonly id: EntityId;
  readonly pinned: boolean;
  readonly query: string;
}

export interface SearchSuggestion {
  readonly id: EntityId;
  readonly label: string;
  readonly source: 'document' | 'frequent' | 'history';
  readonly type: SearchEntityType | 'history';
}

export interface SearchState {
  readonly error: Error | null;
  readonly history: readonly SearchHistoryItem[];
  readonly indexedAt: ISODateTimeString | null;
  readonly query: string;
  readonly response: SearchResponse;
  readonly status: SearchStatus;
  readonly suggestions: readonly SearchSuggestion[];
}
