import { createDisposable, type Disposable } from '@/runtime/utils';

import type { StorageChange, StorageDriver } from './storage-types';

/** In-memory storage driver for tests, offline runtime, and future volatile scopes. */
export class MemoryStorageDriver implements StorageDriver {
  private readonly values = new Map<string, unknown>();
  private readonly listeners = new Set<(changes: readonly StorageChange[]) => void>();

  /** Reads raw values by key. */
  public get(keys: readonly string[]): Promise<Readonly<Record<string, unknown>>> {
    const result: Record<string, unknown> = {};

    for (const key of keys) {
      if (this.values.has(key)) {
        result[key] = this.values.get(key);
      }
    }

    return Promise.resolve(result);
  }

  /** Writes raw values and notifies observers. */
  public set(values: Readonly<Record<string, unknown>>): Promise<void> {
    const changes: StorageChange[] = [];

    for (const [key, newValue] of Object.entries(values)) {
      const oldValue = this.values.get(key);
      this.values.set(key, newValue);
      changes.push({ key, newValue, oldValue });
    }

    this.notify(changes);
    return Promise.resolve();
  }

  /** Removes raw keys and notifies observers. */
  public remove(keys: readonly string[]): Promise<void> {
    const changes: StorageChange[] = [];

    for (const key of keys) {
      const oldValue = this.values.get(key);
      this.values.delete(key);
      changes.push({ key, newValue: undefined, oldValue });
    }

    this.notify(changes);
    return Promise.resolve();
  }

  /** Observes storage changes. */
  public observe(listener: (changes: readonly StorageChange[]) => void): Disposable {
    this.listeners.add(listener);

    return createDisposable(() => {
      this.listeners.delete(listener);
    });
  }

  private notify(changes: readonly StorageChange[]): void {
    for (const listener of this.listeners) {
      listener(changes);
    }
  }
}
