import type { StorageDriver } from '@/runtime/storage';

import type { SemanticPageModel } from './browser-understanding-types';

const SNAPSHOT_INDEX_KEY = 'browser-understanding:snapshots:index';

/** Semantic snapshot persistence boundary. */
export interface SemanticStateStore {
  /** Saves a page model snapshot. */
  save(model: SemanticPageModel): Promise<void>;
  /** Reads a page model snapshot. */
  get(id: string): Promise<SemanticPageModel | undefined>;
  /** Lists snapshots. */
  list(): Promise<readonly SemanticPageModel[]>;
}

/** In-memory semantic state store. */
export class MemorySemanticStateStore implements SemanticStateStore {
  private readonly models = new Map<string, SemanticPageModel>();

  /** Saves a page model snapshot. */
  public save(model: SemanticPageModel): Promise<void> {
    this.models.set(model.id, model);
    return Promise.resolve();
  }

  /** Reads a page model snapshot. */
  public get(id: string): Promise<SemanticPageModel | undefined> {
    return Promise.resolve(this.models.get(id));
  }

  /** Lists snapshots. */
  public list(): Promise<readonly SemanticPageModel[]> {
    return Promise.resolve([...this.models.values()]);
  }
}

/** Storage-driver-backed semantic state store for browser restart durability. */
export class DriverSemanticStateStore implements SemanticStateStore {
  public constructor(private readonly driver: StorageDriver) {}

  /** Saves a page model snapshot. */
  public async save(model: SemanticPageModel): Promise<void> {
    const ids = await this.readIndex();
    await this.driver.set({
      [SNAPSHOT_INDEX_KEY]: ids.includes(model.id) ? ids : [...ids, model.id],
      [snapshotKey(model.id)]: model,
    });
  }

  /** Reads a page model snapshot. */
  public async get(id: string): Promise<SemanticPageModel | undefined> {
    const values = await this.driver.get([snapshotKey(id)]);
    const value = values[snapshotKey(id)];
    return isSemanticPageModel(value) ? value : undefined;
  }

  /** Lists snapshots. */
  public async list(): Promise<readonly SemanticPageModel[]> {
    const ids = await this.readIndex();
    const values = await this.driver.get(ids.map(snapshotKey));
    return ids
      .map((id) => values[snapshotKey(id)])
      .filter((value): value is SemanticPageModel => isSemanticPageModel(value));
  }

  private async readIndex(): Promise<readonly string[]> {
    const values = await this.driver.get([SNAPSHOT_INDEX_KEY]);
    const value = values[SNAPSHOT_INDEX_KEY];
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
  }
}

function snapshotKey(id: string): string {
  return `browser-understanding:snapshot:${id}`;
}

function isSemanticPageModel(value: unknown): value is SemanticPageModel {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { readonly id?: unknown }).id === 'string' &&
    Array.isArray((value as { readonly elements?: unknown }).elements)
  );
}
