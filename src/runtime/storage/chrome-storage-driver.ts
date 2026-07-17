import { createDisposable, type Disposable } from '@/runtime/utils';

import type { StorageChange, StorageDriver, RuntimeStorageArea } from './storage-types';

/** Chrome storage driver for local and sync extension storage areas. */
export class ChromeRuntimeStorageDriver implements StorageDriver {
  public constructor(private readonly area: Exclude<RuntimeStorageArea, 'memory'>) {}

  /** Reads raw values from chrome.storage. */
  public async get(keys: readonly string[]): Promise<Readonly<Record<string, unknown>>> {
    return this.getArea().get([...keys]);
  }

  /** Writes raw values to chrome.storage. */
  public async set(values: Readonly<Record<string, unknown>>): Promise<void> {
    await this.getArea().set(values);
  }

  /** Removes raw keys from chrome.storage. */
  public async remove(keys: readonly string[]): Promise<void> {
    await this.getArea().remove([...keys]);
  }

  /** Observes chrome.storage changes for this area. */
  public observe(listener: (changes: readonly StorageChange[]) => void): Disposable {
    const chromeListener = (
      changes: Readonly<Record<string, chrome.storage.StorageChange>>,
      areaName: string,
    ) => {
      if (areaName !== this.area) {
        return;
      }

      listener(
        Object.entries(changes).map(([key, change]) => ({
          key,
          newValue: change.newValue,
          oldValue: change.oldValue,
        })),
      );
    };

    chrome.storage.onChanged.addListener(chromeListener);

    return createDisposable(() => {
      chrome.storage.onChanged.removeListener(chromeListener);
    });
  }

  private getArea(): chrome.storage.StorageArea {
    return chrome.storage[this.area];
  }
}
