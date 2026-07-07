import type { AIEmbeddingVector, AISemanticDocument } from '@/features/ai/ai-types';
import type { EntityId } from '@/shared/types';

export interface VectorStore {
  clear(): void;
  delete(documentId: EntityId): void;
  search(vector: AIEmbeddingVector, limit: number): readonly AISemanticDocument[];
  upsert(document: AISemanticDocument): void;
}

export class InMemoryVectorStore implements VectorStore {
  private readonly documents = new Map<EntityId, AISemanticDocument>();

  public clear(): void {
    this.documents.clear();
  }

  public delete(documentId: EntityId): void {
    this.documents.delete(documentId);
  }

  public upsert(document: AISemanticDocument): void {
    this.documents.set(document.id, document);
  }

  public search(_vector: AIEmbeddingVector, limit: number): readonly AISemanticDocument[] {
    return [...this.documents.values()].slice(0, limit);
  }
}

export class AISemanticIndex {
  private readonly vectorStore: VectorStore;

  public constructor(vectorStore: VectorStore = new InMemoryVectorStore()) {
    this.vectorStore = vectorStore;
  }

  public upsert(document: AISemanticDocument): void {
    this.vectorStore.upsert(document);
  }

  public search(vector: AIEmbeddingVector, limit: number): readonly AISemanticDocument[] {
    return this.vectorStore.search(vector, limit);
  }

  public clear(): void {
    this.vectorStore.clear();
  }
}
