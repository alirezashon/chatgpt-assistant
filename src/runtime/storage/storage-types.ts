import type { Disposable } from '@/runtime/utils';

/** Storage area identifier. */
export type RuntimeStorageArea = 'local' | 'memory' | 'sync';

/** Storage value validator. */
export type StorageValidator<Value> = (value: unknown) => value is Value;

/** Encryption adapter boundary. Implementations decide the cryptography provider. */
export interface StorageEncryption {
  /** Encrypts a value before persistence. */
  encrypt(value: unknown): Promise<unknown>;
  /** Decrypts a value after reading. */
  decrypt(value: unknown): Promise<unknown>;
}

/** Storage schema definition for a key. */
export interface StorageSchema<Value> {
  /** Storage key. */
  readonly key: string;
  /** Schema version. */
  readonly version: number;
  /** Runtime validator. */
  readonly validate: StorageValidator<Value>;
  /** Default value when missing. */
  readonly defaultValue: Value;
  /** Optional encryption boundary. */
  readonly encryption?: StorageEncryption;
}

/** Storage migration step. */
export interface StorageMigration {
  /** Migration version. */
  readonly version: number;
  /** Migrates raw storage values. */
  migrate(values: Readonly<Record<string, unknown>>): Promise<Readonly<Record<string, unknown>>>;
}

/** Storage change notification. */
export interface StorageChange<Value = unknown> {
  /** Changed key. */
  readonly key: string;
  /** Old value. */
  readonly oldValue: Value | undefined;
  /** New value. */
  readonly newValue: Value | undefined;
}

/** Storage driver interface for Chrome, memory, and future IndexedDB. */
export interface StorageDriver {
  /** Reads raw values. */
  get(keys: readonly string[]): Promise<Readonly<Record<string, unknown>>>;
  /** Writes raw values. */
  set(values: Readonly<Record<string, unknown>>): Promise<void>;
  /** Removes raw keys. */
  remove(keys: readonly string[]): Promise<void>;
  /** Observes raw storage changes. */
  observe(listener: (changes: readonly StorageChange[]) => void): Disposable;
}
