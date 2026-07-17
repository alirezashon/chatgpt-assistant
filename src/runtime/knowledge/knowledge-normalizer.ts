import type { KnowledgeDocument, KnowledgeSourceRecord } from './knowledge-types';

/** Cleans and normalizes source records into documents with metadata, topics, entities, and links. */
export class KnowledgeDocumentNormalizer {
  /** Normalizes a raw source record. */
  public normalize(record: KnowledgeSourceRecord, authority: number, now = Date.now()): KnowledgeDocument {
    const content = cleanText(record.content);

    return {
      authority,
      content,
      contentHash: stableKnowledgeHash(`${record.version}:${content}`),
      entities: extractEntities(content),
      id: `doc-${stableKnowledgeHash(`${record.sourceType}:${record.id}`)}`,
      indexedAt: now,
      links: extractLinks(content),
      metadata: record.metadata,
      modifiedAt: record.modifiedAt,
      permissions: record.permissions,
      quality: content.length > 200 ? 'high' : content.length > 40 ? 'medium' : 'low',
      sourceId: record.id,
      sourceType: record.sourceType,
      title: record.title.trim(),
      topics: extractTopics(content),
      uri: record.uri,
      version: record.version,
    };
  }
}

/** Stable hash used for document/chunk ids. */
export function stableKnowledgeHash(value: string): string {
  let hash = 2_166_136_261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(16);
}

function cleanText(text: string): string {
  return text.replaceAll(/\r\n/g, '\n').replaceAll(/[ \t]+/g, ' ').replaceAll(/\n{3,}/g, '\n\n').trim();
}

function extractLinks(text: string): readonly string[] {
  return [...text.matchAll(/https?:\/\/[^\s)]+/g)].map((match) => match[0]);
}

function extractTopics(text: string): readonly string[] {
  const lower = text.toLowerCase();
  const topics: string[] = [];

  for (const topic of ['mongodb', 'authentication', 'typescript', 'react', 'docker', 'github', 'jira', 'api', 'security']) {
    if (lower.includes(topic)) {
      topics.push(topic);
    }
  }

  return topics;
}

function extractEntities(text: string): readonly string[] {
  return [...new Set([...text.matchAll(/\b[A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*\b/g)].map((match) => match[0]))].slice(0, 20);
}
