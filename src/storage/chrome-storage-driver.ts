import { AppError } from '@/shared/errors';
import type {
  StorageChange,
  StorageChangeListener,
  StorageDriver,
  StorageUnsubscribe,
  StorageValue,
} from '@/storage/storage-driver';
import type { StorageKey } from '@/constants/storage';

export class ChromeStorageDriver implements StorageDriver {
  private readonly area: chrome.storage.StorageArea;

  public constructor(area: chrome.storage.StorageArea = getDefaultStorageArea()) {
    this.area = area;
  }

  public async clear(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.area.clear(() => {
        const error = chrome.runtime.lastError;

        if (error !== undefined) {
          reject(createStorageError('Failed to clear storage.', error));
          return;
        }

        resolve();
      });
    });
  }

  public async get<Value = StorageValue>(key: StorageKey): Promise<Value | undefined> {
    const values = await this.getMany<Value>([key]);

    return values[key];
  }

  public async getMany<Value = StorageValue>(
    keys: readonly StorageKey[],
  ): Promise<Readonly<Record<StorageKey, Value | undefined>>> {
    return await new Promise<Readonly<Record<StorageKey, Value | undefined>>>((resolve, reject) => {
      this.area.get([...keys], (items) => {
        const error = chrome.runtime.lastError;

        if (error !== undefined) {
          reject(createStorageError('Failed to read from storage.', error));
          return;
        }

        const values = items as Readonly<Record<string, unknown>>;
        const result: Partial<Record<StorageKey, Value | undefined>> = {};

        for (const key of keys) {
          result[key] = values[key] as Value | undefined;
        }

        resolve(result as Readonly<Record<StorageKey, Value | undefined>>);
      });
    });
  }

  public async remove(key: StorageKey): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.area.remove(key, () => {
        const error = chrome.runtime.lastError;

        if (error !== undefined) {
          reject(createStorageError('Failed to remove storage value.', error));
          return;
        }

        resolve();
      });
    });
  }

  public async set(key: StorageKey, value: StorageValue): Promise<void> {
    await this.setMany({
      [key]: value,
    });
  }

  public async setMany(values: Readonly<Partial<Record<StorageKey, StorageValue>>>): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.area.set(values, () => {
        const error = chrome.runtime.lastError;

        if (error !== undefined) {
          reject(createStorageError('Failed to write to storage.', error));
          return;
        }

        resolve();
      });
    });
  }

  public subscribe(listener: StorageChangeListener): StorageUnsubscribe {
    const handleChange = (
      changes: Readonly<Record<string, chrome.storage.StorageChange>>,
      areaName: string,
    ) => {
      if (areaName !== 'local') {
        return;
      }

      const storageChanges = Object.entries(changes).map<StorageChange>(([key, change]) => ({
        key: key as StorageKey,
        newValue: change.newValue,
        oldValue: change.oldValue,
      }));

      listener(storageChanges);
    };

    chrome.storage.onChanged.addListener(handleChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleChange);
    };
  }
}

function getDefaultStorageArea(): chrome.storage.StorageArea {
  const runtimeGlobal = globalThis as typeof globalThis & {
    chrome?: unknown;
  };

  if (!hasChromeStorage(runtimeGlobal.chrome)) {
    throw new AppError('CHROME_API_UNAVAILABLE', 'Chrome local storage is not available.');
  }

  return runtimeGlobal.chrome.storage.local;
}

interface ChromeStorageRuntime {
  readonly storage: {
    readonly local: chrome.storage.StorageArea;
  };
}

function hasChromeStorage(value: unknown): value is ChromeStorageRuntime {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    readonly storage?: {
      readonly local?: unknown;
    };
  };

  return candidate.storage?.local !== undefined;
}

function createStorageError(message: string, cause: chrome.runtime.LastError): AppError {
  return new AppError('STORAGE_ERROR', message, {
    cause,
    context: {
      chromeMessage: cause.message,
    },
  });
}
