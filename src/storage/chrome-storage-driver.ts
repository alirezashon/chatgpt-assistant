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
      try {
        this.area.clear(() => {
          const error = chrome.runtime.lastError;

          if (error !== undefined) {
            reject(createStorageError('Failed to clear storage.', error));
            return;
          }

          resolve();
        });
      } catch (error) {
        reject(createStorageException('Failed to clear storage.', error));
      }
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
      try {
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
      } catch (error) {
        reject(createStorageException('Failed to read from storage.', error));
      }
    });
  }

  public async remove(key: StorageKey): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      try {
        this.area.remove(key, () => {
          const error = chrome.runtime.lastError;

          if (error !== undefined) {
            reject(createStorageError('Failed to remove storage value.', error));
            return;
          }

          resolve();
        });
      } catch (error) {
        reject(createStorageException('Failed to remove storage value.', error));
      }
    });
  }

  public async set(key: StorageKey, value: StorageValue): Promise<void> {
    await this.setMany({
      [key]: value,
    });
  }

  public async setMany(values: Readonly<Partial<Record<StorageKey, StorageValue>>>): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      try {
        this.area.set(values, () => {
          const error = chrome.runtime.lastError;

          if (error !== undefined) {
            reject(createStorageError('Failed to write to storage.', error));
            return;
          }

          resolve();
        });
      } catch (error) {
        reject(createStorageException('Failed to write to storage.', error));
      }
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

    try {
      chrome.storage.onChanged.addListener(handleChange);
    } catch {
      return noopUnsubscribe;
    }

    return () => {
      try {
        chrome.storage.onChanged.removeListener(handleChange);
      } catch {
        // The extension context can disappear after an extension reload.
      }
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

function noopUnsubscribe(): void {
  return undefined;
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
  return new AppError(
    isExtensionContextInvalidated(cause) ? 'EXTENSION_CONTEXT_INVALIDATED' : 'STORAGE_ERROR',
    message,
    {
      cause,
      context: {
        chromeMessage: cause.message,
      },
    },
  );
}

function createStorageException(message: string, cause: unknown): AppError {
  return new AppError(
    isExtensionContextInvalidated(cause) ? 'EXTENSION_CONTEXT_INVALIDATED' : 'STORAGE_ERROR',
    message,
    {
      cause,
    },
  );
}

function isExtensionContextInvalidated(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const message = (value as { readonly message?: unknown }).message;

  return typeof message === 'string' && message.includes('Extension context invalidated');
}
