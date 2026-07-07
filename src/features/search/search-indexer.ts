import type {
  SearchDocument,
  SearchProvider,
  SearchProviderContext,
} from '@/features/search/search-types';

export class SearchIndexer {
  public collectDocuments(
    providers: readonly SearchProvider[],
    context: SearchProviderContext,
  ): readonly SearchDocument[] {
    return providers.flatMap((provider) => provider.getDocuments(context));
  }
}
