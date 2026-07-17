import { Mutex, RuntimeError } from '@/runtime/utils';

import type {
  StorageChange,
  StorageDriver,
  StorageMigration,
  StorageSchema,
} from './storage-types';

/** Typed storage runtime with validation, migrations, caching, transactions, and observers. */
export class StorageRuntime {
  private readonly schemas = new Map<string, StorageSchema<unknown>>();
  private readonly cache = new Map<string, unknown>();
  private readonly mutex = new Mutex();

  public constructor(
    private readonly driver: StorageDriver,
    private readonly migrations: readonly StorageMigration[] = [],
  ) {
    this.driver.observe((changes) => {
      for (const change of changes) {
        if (change.newValue === undefined) {
          this.cache.delete(change.key);
          continue;
        }

        this.cache.set(change.key, change.newValue);
      }
    });
  }

  /** Registers a typed schema. */
  public registerSchema<Value>(schema: StorageSchema<Value>): void {
    if (this.schemas.has(schema.key)) {
      throw new RuntimeError(
        'REGISTRATION_CONFLICT',
        `Storage schema already registered: ${schema.key}`,
      );
    }

    this.schemas.set(schema.key, schema);
  }

  /** Reads a typed value and falls back to schema default. */
  public async get<Value>(schema: StorageSchema<Value>): Promise<Value> {
    const cached = this.cache.get(schema.key);

    if (cached !== undefined) {
      return this.decode(schema, cached);
    }

    const values = await this.driver.get([schema.key]);
    const raw = values[schema.key];

    if (raw === undefined) {
      return schema.defaultValue;
    }

    this.cache.set(schema.key, raw);
    return this.decode(schema, raw);
  }

  /** Writes a typed value after validation and optional encryption. */
  public async set<Value>(schema: StorageSchema<Value>, value: Value): Promise<void> {
    if (!schema.validate(value)) {
      throw new RuntimeError('CONTRACT_VIOLATION', `Invalid storage value for key: ${schema.key}`);
    }

    const encoded =
      schema.encryption === undefined ? value : await schema.encryption.encrypt(value);
    await this.driver.set({ [schema.key]: encoded });
  }

  /** Removes a typed value. */
  public async remove(schema: StorageSchema<unknown>): Promise<void> {
    await this.driver.remove([schema.key]);
  }

  /** Runs a serialized storage transaction. */
  public async transaction<Value>(callback: () => Promise<Value> | Value): Promise<Value> {
    return this.mutex.runExclusive(callback);
  }

  /** Runs registered migrations over all known schema keys. */
  public async migrate(): Promise<void> {
    const keys = [...this.schemas.keys()];
    let values = await this.driver.get(keys);

    for (const migration of [...this.migrations].sort(
      (left, right) => left.version - right.version,
    )) {
      values = await migration.migrate(values);
    }

    await this.driver.set(values);
  }

  /** Observes typed storage changes. */
  public observe(listener: (changes: readonly StorageChange[]) => void) {
    return this.driver.observe(listener);
  }

  private async decode<Value>(schema: StorageSchema<Value>, raw: unknown): Promise<Value> {
    const decoded = schema.encryption === undefined ? raw : await schema.encryption.decrypt(raw);

    if (!schema.validate(decoded)) {
      throw new RuntimeError('CONTRACT_VIOLATION', `Stored value failed validation: ${schema.key}`);
    }

    return decoded;
  }
}
