import type { StorageDriver } from '@/runtime/storage';

import type { MemoryGraphNode, MemoryItem, MemoryRelationship, MemoryType } from './memory-types';

const MEMORY_INDEX_KEY = 'personal-memory:index';
const NODE_INDEX_KEY = 'personal-memory:nodes:index';
const RELATIONSHIP_INDEX_KEY = 'personal-memory:relationships:index';

/** Memory storage boundary. */
export interface MemoryStore {
  /** Saves a memory item. */
  save(item: MemoryItem): Promise<void>;
  /** Reads a memory item. */
  get(id: string): Promise<MemoryItem | undefined>;
  /** Lists memory items. */
  list(): Promise<readonly MemoryItem[]>;
  /** Deletes a memory item. */
  delete(id: string): Promise<void>;
  /** Deletes all memory items. */
  deleteAll(): Promise<void>;
  /** Saves graph node. */
  saveNode(node: MemoryGraphNode): Promise<void>;
  /** Saves relationship. */
  saveRelationship(relationship: MemoryRelationship): Promise<void>;
  /** Lists graph nodes. */
  listNodes(): Promise<readonly MemoryGraphNode[]>;
  /** Lists relationships. */
  listRelationships(): Promise<readonly MemoryRelationship[]>;
}

/** In-memory memory store. */
export class MemoryInMemoryStore implements MemoryStore {
  private readonly items = new Map<string, MemoryItem>();
  private readonly nodes = new Map<string, MemoryGraphNode>();
  private readonly relationships = new Map<string, MemoryRelationship>();

  public save(item: MemoryItem): Promise<void> {
    this.items.set(item.id, item);
    return Promise.resolve();
  }

  public get(id: string): Promise<MemoryItem | undefined> {
    return Promise.resolve(this.items.get(id));
  }

  public list(): Promise<readonly MemoryItem[]> {
    return Promise.resolve([...this.items.values()]);
  }

  public delete(id: string): Promise<void> {
    this.items.delete(id);
    return Promise.resolve();
  }

  public deleteAll(): Promise<void> {
    this.items.clear();
    this.nodes.clear();
    this.relationships.clear();
    return Promise.resolve();
  }

  public saveNode(node: MemoryGraphNode): Promise<void> {
    this.nodes.set(node.id, node);
    return Promise.resolve();
  }

  public saveRelationship(relationship: MemoryRelationship): Promise<void> {
    this.relationships.set(relationship.id, relationship);
    return Promise.resolve();
  }

  public listNodes(): Promise<readonly MemoryGraphNode[]> {
    return Promise.resolve([...this.nodes.values()]);
  }

  public listRelationships(): Promise<readonly MemoryRelationship[]> {
    return Promise.resolve([...this.relationships.values()]);
  }
}

/** Storage-driver-backed memory store for browser persistence. */
export class DriverMemoryStore implements MemoryStore {
  public constructor(private readonly driver: StorageDriver) {}

  public async save(item: MemoryItem): Promise<void> {
    const ids = await this.readIndex(MEMORY_INDEX_KEY);
    await this.driver.set({
      [MEMORY_INDEX_KEY]: ids.includes(item.id) ? ids : [...ids, item.id],
      [memoryKey(item.id)]: item,
    });
  }

  public async get(id: string): Promise<MemoryItem | undefined> {
    const values = await this.driver.get([memoryKey(id)]);
    const value = values[memoryKey(id)];
    return isMemoryItem(value) ? value : undefined;
  }

  public async list(): Promise<readonly MemoryItem[]> {
    const ids = await this.readIndex(MEMORY_INDEX_KEY);
    const values = await this.driver.get(ids.map(memoryKey));
    return ids
      .map((id) => values[memoryKey(id)])
      .filter((value): value is MemoryItem => isMemoryItem(value));
  }

  public async delete(id: string): Promise<void> {
    const ids = await this.readIndex(MEMORY_INDEX_KEY);
    await this.driver.set({ [MEMORY_INDEX_KEY]: ids.filter((item) => item !== id) });
    await this.driver.remove([memoryKey(id)]);
  }

  public async deleteAll(): Promise<void> {
    const memoryIds = await this.readIndex(MEMORY_INDEX_KEY);
    const nodeIds = await this.readIndex(NODE_INDEX_KEY);
    const relationshipIds = await this.readIndex(RELATIONSHIP_INDEX_KEY);
    await this.driver.remove([
      ...memoryIds.map(memoryKey),
      ...nodeIds.map(nodeKey),
      ...relationshipIds.map(relationshipKey),
      MEMORY_INDEX_KEY,
      NODE_INDEX_KEY,
      RELATIONSHIP_INDEX_KEY,
    ]);
  }

  public async saveNode(node: MemoryGraphNode): Promise<void> {
    const ids = await this.readIndex(NODE_INDEX_KEY);
    await this.driver.set({
      [NODE_INDEX_KEY]: ids.includes(node.id) ? ids : [...ids, node.id],
      [nodeKey(node.id)]: node,
    });
  }

  public async saveRelationship(relationship: MemoryRelationship): Promise<void> {
    const ids = await this.readIndex(RELATIONSHIP_INDEX_KEY);
    await this.driver.set({
      [RELATIONSHIP_INDEX_KEY]: ids.includes(relationship.id) ? ids : [...ids, relationship.id],
      [relationshipKey(relationship.id)]: relationship,
    });
  }

  public async listNodes(): Promise<readonly MemoryGraphNode[]> {
    const ids = await this.readIndex(NODE_INDEX_KEY);
    const values = await this.driver.get(ids.map(nodeKey));
    return ids
      .map((id) => values[nodeKey(id)])
      .filter((value): value is MemoryGraphNode => isGraphNode(value));
  }

  public async listRelationships(): Promise<readonly MemoryRelationship[]> {
    const ids = await this.readIndex(RELATIONSHIP_INDEX_KEY);
    const values = await this.driver.get(ids.map(relationshipKey));
    return ids
      .map((id) => values[relationshipKey(id)])
      .filter((value): value is MemoryRelationship => isRelationship(value));
  }

  private async readIndex(key: string): Promise<readonly string[]> {
    const values = await this.driver.get([key]);
    const value = values[key];
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
  }
}

/** Returns true if a memory is expired. */
export function isExpired(item: MemoryItem, now = Date.now()): boolean {
  return item.expiration.expiresAt !== undefined && item.expiration.expiresAt <= now;
}

/** Returns default expiration for a memory type. */
export function getDefaultExpiration(type: MemoryType, now = Date.now()) {
  if (type === 'working') {
    return { decayPerDay: 0.5, expiresAt: now + 60 * 60 * 1000, persistent: false };
  }

  if (type === 'short-term') {
    return { decayPerDay: 0.2, expiresAt: now + 7 * 24 * 60 * 60 * 1000, persistent: false };
  }

  if (type === 'episodic') {
    return { decayPerDay: 0.03, expiresAt: now + 180 * 24 * 60 * 60 * 1000, persistent: false };
  }

  return { decayPerDay: 0.005, persistent: true };
}

function memoryKey(id: string): string {
  return `personal-memory:item:${id}`;
}

function nodeKey(id: string): string {
  return `personal-memory:node:${id}`;
}

function relationshipKey(id: string): string {
  return `personal-memory:relationship:${id}`;
}

function isMemoryItem(value: unknown): value is MemoryItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { readonly id?: unknown }).id === 'string'
  );
}

function isGraphNode(value: unknown): value is MemoryGraphNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { readonly id?: unknown }).id === 'string'
  );
}

function isRelationship(value: unknown): value is MemoryRelationship {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { readonly id?: unknown }).id === 'string'
  );
}
