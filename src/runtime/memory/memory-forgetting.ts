import type { MemoryStore } from './memory-store';
import { isExpired } from './memory-store';
import type { MemoryType } from './memory-types';

/** Implements explicit and automatic forgetting controls. */
export class MemoryForgettingService {
  public constructor(private readonly store: MemoryStore) {}

  /** Deletes one memory. */
  public delete(id: string): Promise<void> {
    return this.store.delete(id);
  }

  /** Deletes all memories. */
  public deleteAll(): Promise<void> {
    return this.store.deleteAll();
  }

  /** Deletes all memories of a type. */
  public async forgetType(type: MemoryType): Promise<number> {
    const items = await this.store.list();
    const matching = items.filter((item) => item.type === type);

    for (const item of matching) {
      await this.store.delete(item.id);
    }

    return matching.length;
  }

  /** Deletes expired memories. */
  public async cleanupExpired(now = Date.now()): Promise<number> {
    const items = await this.store.list();
    const expired = items.filter((item) => isExpired(item, now));

    for (const item of expired) {
      await this.store.delete(item.id);
    }

    return expired.length;
  }
}
