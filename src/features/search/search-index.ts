import type { IndexedSearchDocument, SearchDocument } from '@/features/search/search-types';
import { createIndexedDocument } from '@/features/search/search-utils';

export class SearchIndex {
  private readonly documentsById = new Map<string, IndexedSearchDocument>();
  private version = 0;

  public getVersion(): number {
    return this.version;
  }

  public replaceDocuments(documents: readonly SearchDocument[]): void {
    const nextDocumentsById = new Map(
      documents.map((document) => [document.id, createIndexedDocument(document)]),
    );

    if (createIndexSignature([...nextDocumentsById.values()]) === this.createSignature()) {
      return;
    }

    this.documentsById.clear();

    for (const [documentId, document] of nextDocumentsById) {
      this.documentsById.set(documentId, document);
    }

    this.version += 1;
  }

  public getAllDocuments(): readonly IndexedSearchDocument[] {
    return [...this.documentsById.values()];
  }

  private createSignature(): string {
    return createIndexSignature([...this.documentsById.values()]);
  }
}

function createIndexSignature(documents: readonly IndexedSearchDocument[]): string {
  return documents
    .map((document) => `${document.id}:${document.updatedAt}:${document.title}`)
    .sort()
    .join('|');
}
