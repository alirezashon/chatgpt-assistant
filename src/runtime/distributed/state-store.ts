import type { DistributedStateRecord, DistributedStateStore, DistributedValue } from './distributed-types';

/** Versioned checkpoint state store for distributed tasks. */
export class MemoryDistributedStateStore implements DistributedStateStore {
  private readonly records = new Map<string, DistributedStateRecord>();

  /** Checkpoints a key. */
  public checkpoint(key: string, value: DistributedValue): DistributedStateRecord {
    const existing = this.records.get(key);
    const version = (existing?.version ?? 0) + 1;
    const record: DistributedStateRecord = {
      history: [
        ...(existing?.history ?? []),
        {
          timestamp: Date.now(),
          value,
          version,
        },
      ],
      key,
      updatedAt: Date.now(),
      value,
      version,
    };
    this.records.set(key, record);
    return record;
  }

  /** Reads state. */
  public get(key: string): DistributedStateRecord | undefined {
    return this.records.get(key);
  }

  /** Lists state. */
  public list(prefix?: string): readonly DistributedStateRecord[] {
    return [...this.records.values()].filter((record) => prefix === undefined || record.key.startsWith(prefix));
  }
}
