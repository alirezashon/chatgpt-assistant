import type { StorageKey } from '@/constants/storage';

export type StorageValue = unknown;

export interface StorageChange<Value = StorageValue> {
  readonly key: StorageKey;
  readonly newValue: Value | undefined;
  readonly oldValue: Value | undefined;
}

export type StorageChangeListener = (changes: readonly StorageChange[]) => void;
export type StorageUnsubscribe = () => void;

export interface StorageDriver {
  clear(): Promise<void>;
  get<Value = StorageValue>(key: StorageKey): Promise<Value | undefined>;
  getMany<Value = StorageValue>(
    keys: readonly StorageKey[],
  ): Promise<Readonly<Record<StorageKey, Value | undefined>>>;
  remove(key: StorageKey): Promise<void>;
  set(key: StorageKey, value: StorageValue): Promise<void>;
  setMany(values: Readonly<Partial<Record<StorageKey, StorageValue>>>): Promise<void>;
  subscribe(listener: StorageChangeListener): StorageUnsubscribe;
}
