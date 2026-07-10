import { describe, expect, it } from 'vitest';

import { STORAGE_KEYS, type StorageKey } from '@/constants/storage';
import {
  LOCAL_DIAGNOSTIC_BUNDLE_KIND,
  MAX_LOCAL_ERROR_REPORTS,
  appendLocalErrorReport,
  clearLocalErrorReports,
  createLocalDiagnosticBundle,
  createLocalErrorReport,
  readLocalErrorReports,
} from '@/features/diagnostics/local-error-reporting';
import type {
  StorageChangeListener,
  StorageDriver,
  StorageUnsubscribe,
  StorageValue,
} from '@/storage';

class MemoryStorageDriver implements StorageDriver {
  public readonly values = new Map<StorageKey, StorageValue>();

  public constructor(initialValues: Readonly<Partial<Record<StorageKey, StorageValue>>> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.values.set(key as StorageKey, value);
    }
  }

  public clear(): Promise<void> {
    this.values.clear();

    return Promise.resolve();
  }

  public get<Value = StorageValue>(key: StorageKey): Promise<Value | undefined> {
    return Promise.resolve(this.values.get(key) as Value | undefined);
  }

  public getMany<Value = StorageValue>(
    keys: readonly StorageKey[],
  ): Promise<Readonly<Record<StorageKey, Value | undefined>>> {
    const result: Partial<Record<StorageKey, Value | undefined>> = {};

    for (const key of keys) {
      result[key] = this.values.get(key) as Value | undefined;
    }

    return Promise.resolve(result as Readonly<Record<StorageKey, Value | undefined>>);
  }

  public remove(key: StorageKey): Promise<void> {
    this.values.delete(key);

    return Promise.resolve();
  }

  public set(key: StorageKey, value: StorageValue): Promise<void> {
    this.values.set(key, value);

    return Promise.resolve();
  }

  public setMany(values: Readonly<Partial<Record<StorageKey, StorageValue>>>): Promise<void> {
    for (const [key, value] of Object.entries(values)) {
      this.values.set(key as StorageKey, value);
    }

    return Promise.resolve();
  }

  public subscribe(listener: StorageChangeListener): StorageUnsubscribe {
    void listener;

    return () => {
      // Memory test storage has no change stream.
    };
  }
}

describe('local error reporting', () => {
  it('creates sanitized local error reports', () => {
    const report = createLocalErrorReport(
      {
        error: new Error('Broken sidebar'),
        surface: 'content-script',
        url: 'https://chatgpt.com/c/123?private=true#frag',
      },
      () => new Date('2026-07-10T10:00:00.000Z'),
      () => 'diag-test',
    );

    expect(report).toMatchObject({
      id: 'diag-test',
      message: 'Broken sidebar',
      name: 'Error',
      surface: 'content-script',
      timestamp: '2026-07-10T10:00:00.000Z',
      url: 'https://chatgpt.com/c/123',
    });
  });

  it('stores a bounded newest-first local report history', async () => {
    const storage = new MemoryStorageDriver();

    for (let index = 0; index < MAX_LOCAL_ERROR_REPORTS + 2; index += 1) {
      await appendLocalErrorReport(
        storage,
        createLocalErrorReport(
          {
            message: `Error ${String(index)}`,
            surface: 'options',
          },
          () => new Date(`2026-07-10T10:00:${String(index).padStart(2, '0')}.000Z`),
          () => `diag-${String(index)}`,
        ),
      );
    }

    const reports = await readLocalErrorReports(storage);

    expect(reports).toHaveLength(MAX_LOCAL_ERROR_REPORTS);
    expect(reports[0]?.id).toBe(`diag-${String(MAX_LOCAL_ERROR_REPORTS + 1)}`);
    expect(reports.at(-1)?.id).toBe('diag-2');
  });

  it('exports and clears a local diagnostic bundle', async () => {
    const storage = new MemoryStorageDriver();
    await appendLocalErrorReport(
      storage,
      createLocalErrorReport(
        {
          message: 'Popup failed',
          surface: 'popup',
        },
        () => new Date('2026-07-10T10:00:00.000Z'),
        () => 'diag-popup',
      ),
    );

    const bundle = await createLocalDiagnosticBundle(
      storage,
      () => new Date('2026-07-10T11:00:00.000Z'),
    );

    expect(bundle.kind).toBe(LOCAL_DIAGNOSTIC_BUNDLE_KIND);
    expect(bundle.exportedAt).toBe('2026-07-10T11:00:00.000Z');
    expect(bundle.reports).toHaveLength(1);
    expect(bundle.privacyNote).toContain('not uploaded automatically');

    await clearLocalErrorReports(storage);

    expect(await storage.get(STORAGE_KEYS.diagnostics)).toBeUndefined();
  });
});
