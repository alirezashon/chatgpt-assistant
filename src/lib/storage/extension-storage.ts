export type ExtensionStorageAreaName = 'local' | 'session' | 'sync';

export interface ExtensionStorage {
  clear(): Promise<void>;
  get(key: string): Promise<unknown>;
  getMany(keys: readonly string[]): Promise<Readonly<Record<string, unknown>>>;
  remove(key: string): Promise<void>;
  set(key: string, value: unknown): Promise<void>;
}

export class ChromeExtensionStorage implements ExtensionStorage {
  private readonly areaName: ExtensionStorageAreaName;

  public constructor(areaName: ExtensionStorageAreaName = 'local') {
    this.areaName = areaName;
  }

  public async clear(): Promise<void> {
    await this.getArea().clear();
  }

  public async get(key: string): Promise<unknown> {
    const value = await this.getArea().get(key);

    return value[key];
  }

  public async getMany(keys: readonly string[]): Promise<Readonly<Record<string, unknown>>> {
    return this.getArea().get([...keys]);
  }

  public async remove(key: string): Promise<void> {
    await this.getArea().remove(key);
  }

  public async set(key: string, value: unknown): Promise<void> {
    await this.getArea().set({
      [key]: value,
    });
  }

  private getArea(): chrome.storage.StorageArea {
    return chrome.storage[this.areaName];
  }
}
