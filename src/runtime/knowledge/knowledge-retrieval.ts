import type { KnowledgeEmbeddingProvider } from './knowledge-embedding';
import type { KnowledgeIndex } from './knowledge-index';
import { KnowledgeRankingEngine } from './knowledge-ranking';
import type { KnowledgeQuery, KnowledgeRetrievalResult } from './knowledge-types';

/** Multi-stage retrieval engine: query expansion, keyword, vector, graph, ranking. */
export class KnowledgeRetrievalEngine {
  private readonly ranking = new KnowledgeRankingEngine();

  public constructor(
    private readonly index: KnowledgeIndex,
    private readonly embeddings: KnowledgeEmbeddingProvider,
  ) {}

  /** Retrieves ranked chunks. */
  public async retrieve(query: KnowledgeQuery): Promise<readonly KnowledgeRetrievalResult[]> {
    const expanded = expandQuery(query.text);
    const queryEmbedding = await this.embeddings.embed(expanded);
    const metadata = this.index.metadataFilter({
      permissions: query.permissions,
      ...(query.sourceTypes === undefined ? {} : { sourceTypes: query.sourceTypes }),
      ...(query.topics === undefined ? {} : { topics: query.topics }),
    });
    const keyword = this.index.keywordSearch(expanded, query.permissions);
    const vector = this.index.vectorSearch(queryEmbedding.vector, query.permissions);
    const graph = this.index.graphRelated([...keyword, ...vector]);
    const metadataIds = new Set(metadata.map((chunk) => chunk.chunk.id));
    const candidates = [...keyword, ...vector, ...graph].filter((chunk) => metadataIds.has(chunk.chunk.id));

    return this.ranking.rank({
      candidates,
      query,
      queryVector: queryEmbedding.vector,
      usageByDocument: {},
    });
  }
}

function expandQuery(query: string): string {
  const lower = query.toLowerCase();
  const expansions: string[] = [query];

  if (lower.includes('auth')) {
    expansions.push('authentication login credentials configuration');
  }

  if (lower.includes('mongo')) {
    expansions.push('mongodb database connection');
  }

  if (lower.includes('api')) {
    expansions.push('endpoint route controller service');
  }

  return expansions.join(' ');
}
