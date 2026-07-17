import { EventBus } from '@/runtime/events';

import { MemoryContradictionDetector } from './memory-contradiction';
import { LocalMemoryEmbeddingProvider, type MemoryEmbeddingProvider } from './memory-embedding';
import { MemoryExtractionEngine } from './memory-extraction';
import { MemoryForgettingService } from './memory-forgetting';
import { MemoryKnowledgeGraph } from './memory-graph';
import { MemoryPrivacyManager } from './memory-privacy';
import { MemoryRetrievalEngine } from './memory-retrieval';
import { MemoryConfidenceScorer, MemoryImportanceScorer } from './memory-scoring';
import { getDefaultExpiration, MemoryInMemoryStore, type MemoryStore } from './memory-store';
import type {
  MemoryGraph,
  MemoryItem,
  MemoryObservation,
  MemoryPermission,
  MemoryQuery,
  MemoryRetrievalResult,
  MemoryRuntimeEvents,
  MemoryType,
} from './memory-types';

/** Memory runtime dependencies. */
export interface MemoryRuntimeDependencies {
  /** Store. */
  readonly store?: MemoryStore;
  /** Embedding provider. */
  readonly embeddings?: MemoryEmbeddingProvider;
  /** Event bus. */
  readonly events?: EventBus<MemoryRuntimeEvents>;
  /** Privacy manager. */
  readonly privacy?: MemoryPrivacyManager;
}

/** Personal memory runtime. */
export class MemoryRuntime {
  /** Runtime events. */
  public readonly events: EventBus<MemoryRuntimeEvents>;

  private readonly store: MemoryStore;
  private readonly embeddings: MemoryEmbeddingProvider;
  private readonly extraction = new MemoryExtractionEngine();
  private readonly importance = new MemoryImportanceScorer();
  private readonly confidence = new MemoryConfidenceScorer();
  private readonly graph = new MemoryKnowledgeGraph();
  private readonly contradictions = new MemoryContradictionDetector();
  private readonly retrieval: MemoryRetrievalEngine;
  private readonly forgetting: MemoryForgettingService;
  private readonly privacy: MemoryPrivacyManager;

  public constructor(dependencies: MemoryRuntimeDependencies = {}) {
    this.store = dependencies.store ?? new MemoryInMemoryStore();
    this.embeddings = dependencies.embeddings ?? new LocalMemoryEmbeddingProvider();
    this.events = dependencies.events ?? new EventBus<MemoryRuntimeEvents>();
    this.privacy = dependencies.privacy ?? new MemoryPrivacyManager();
    this.retrieval = new MemoryRetrievalEngine(this.embeddings);
    this.forgetting = new MemoryForgettingService(this.store);
  }

  /** Observes information, extracts memory candidates, and stores approved/pending memories. */
  public async observe(
    observation: MemoryObservation,
    now = Date.now(),
  ): Promise<readonly MemoryItem[]> {
    if (!this.privacy.canExtract(observation)) {
      return [];
    }

    const candidates = this.extraction.extract(observation);
    const stored: MemoryItem[] = [];

    for (const candidate of candidates) {
      const item = await this.createItem(candidate, observation, now);
      await this.storeMemory(item);
      stored.push(item);
    }

    return stored;
  }

  /** Stores an explicit user memory. */
  public async remember(input: {
    readonly type: MemoryType;
    readonly title: string;
    readonly content: string;
    readonly value?: MemoryItem['value'];
    readonly tags?: readonly string[];
    readonly source: MemoryObservation['source'];
    readonly permissions?: readonly MemoryPermission[];
  }): Promise<MemoryItem> {
    const observation: MemoryObservation = {
      context: input.value ?? { content: input.content },
      id: crypto.randomUUID(),
      sensitivity: 'personal',
      source: input.source,
      taskSuccess: true,
      text: input.content,
      userConfirmed: true,
    };
    const item = await this.createItem(
      {
        content: input.content,
        sensitivity: 'personal',
        tags: input.tags ?? [],
        title: input.title,
        type: input.type,
        value: input.value ?? { content: input.content },
      },
      observation,
      Date.now(),
      input.permissions,
    );
    await this.storeMemory(item);
    return item;
  }

  /** Retrieves relevant approved memories. */
  public async retrieve(query: MemoryQuery): Promise<readonly MemoryRetrievalResult[]> {
    const items = (await this.store.list()).filter((item) => this.privacy.canRetrieve(item));
    const relationships = await this.store.listRelationships();
    const results = await this.retrieval.retrieve({
      items,
      query,
      relationships,
    });
    await this.events.emit('memory.retrieved', {
      query: query.text,
      resultCount: results.length,
    });
    return results;
  }

  /** Approves a pending memory. */
  public async approve(memoryId: string): Promise<MemoryItem | undefined> {
    const item = await this.store.get(memoryId);

    if (item === undefined) {
      return undefined;
    }

    const approved: MemoryItem = {
      ...item,
      approval: 'approved',
      updatedAt: Date.now(),
    };
    await this.store.save(approved);
    return approved;
  }

  /** Lists all memory items. */
  public list(): Promise<readonly MemoryItem[]> {
    return this.store.list();
  }

  /** Returns graph snapshot. */
  public async graphSnapshot(): Promise<MemoryGraph> {
    return this.graph.snapshot(await this.store.listNodes(), await this.store.listRelationships());
  }

  /** Deletes one memory. */
  public async delete(memoryId: string): Promise<void> {
    await this.forgetting.delete(memoryId);
    await this.events.emit('memory.deleted', { memoryId });
  }

  /** Deletes memories by type. */
  public forgetType(type: MemoryType): Promise<number> {
    return this.forgetting.forgetType(type);
  }

  /** Deletes expired memories. */
  public async cleanupExpired(now = Date.now()): Promise<number> {
    const items = await this.store.list();
    const deleted = await this.forgetting.cleanupExpired(now);

    for (const item of items) {
      if (item.expiration.expiresAt !== undefined && item.expiration.expiresAt <= now) {
        await this.events.emit('memory.expired', { memoryId: item.id });
      }
    }

    return deleted;
  }

  /** Deletes all memory data. */
  public deleteAll(): Promise<void> {
    return this.forgetting.deleteAll();
  }

  private async createItem(
    candidate: Parameters<MemoryExtractionEngine['extract']>[0] extends never
      ? never
      : ReturnType<MemoryExtractionEngine['extract']>[number],
    observation: MemoryObservation,
    now: number,
    permissions: readonly MemoryPermission[] = ['memory.read', 'memory.apply'],
  ): Promise<MemoryItem> {
    const embedding = await this.embeddings.embed(
      `${candidate.title}\n${candidate.content}\n${candidate.tags.join(' ')}`,
    );
    const importance = this.importance.score({
      frequency: 1,
      futureUsefulness:
        candidate.type === 'preference' || candidate.type === 'semantic' ? 0.9 : 0.45,
      now,
      observation,
      type: candidate.type,
    });
    const confidence = this.confidence.score({
      contradictionPenalty: 0,
      evidenceCount: 1,
      sourceTrust: observation.source.trust,
      userConfirmed: observation.userConfirmed,
    });

    return {
      approval: this.privacy.approvalFor(observation),
      confidence,
      content: candidate.content,
      createdAt: now,
      embedding,
      expiration: getDefaultExpiration(candidate.type, now),
      id: crypto.randomUUID(),
      importance,
      permissions,
      sensitivity: candidate.sensitivity,
      source: observation.source,
      tags: candidate.tags,
      title: candidate.title,
      type: candidate.type,
      updatedAt: now,
      value: candidate.value,
    };
  }

  private async storeMemory(item: MemoryItem): Promise<void> {
    const existing = await this.store.list();
    const conflicts = this.contradictions.detect(item, existing);
    const related = this.graph.inferRelationships(item, existing);

    await this.store.save(item);
    await this.store.saveNode(this.graph.createNode(item));

    for (const relationship of [...related, ...conflicts]) {
      await this.store.saveRelationship(relationship);

      if (relationship.type === 'conflicts_with') {
        await this.reduceConflictingMemoryConfidence(relationship.to);
        await this.events.emit('memory.conflict', {
          conflictsWith: relationship.to,
          memoryId: item.id,
        });
      }
    }

    await this.events.emit('memory.created', {
      memoryId: item.id,
      type: item.type,
    });
  }

  private async reduceConflictingMemoryConfidence(memoryId: string): Promise<void> {
    const existing = await this.store.get(memoryId);

    if (existing === undefined) {
      return;
    }

    await this.store.save({
      ...existing,
      confidence: {
        ...existing.confidence,
        contradictionPenalty: Math.min(1, existing.confidence.contradictionPenalty + 0.25),
        score: Math.max(0, existing.confidence.score - 0.25),
      },
      updatedAt: Date.now(),
    });
  }
}
