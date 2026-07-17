import { describe, expect, it } from 'vitest';

import { MemoryStorageDriver } from './memory-storage-driver';
import { StorageRuntime } from './storage-runtime';
import type { StorageSchema } from './storage-types';

const schema: StorageSchema<{ readonly enabled: boolean }> = {
  defaultValue: { enabled: false },
  key: 'settings',
  validate: (value): value is { readonly enabled: boolean } =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { readonly enabled?: unknown }).enabled === 'boolean',
  version: 1,
};

describe('StorageRuntime', () => {
  it('returns defaults and validates writes', async () => {
    const storage = new StorageRuntime(new MemoryStorageDriver());

    expect(await storage.get(schema)).toEqual({ enabled: false });
    await storage.set(schema, { enabled: true });
    expect(await storage.get(schema)).toEqual({ enabled: true });
  });
});
