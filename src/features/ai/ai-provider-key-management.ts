import type { AIProviderKind } from '@/features/ai/ai-types';

export interface AIProviderKeyMetadata {
  readonly createdAt: string;
  readonly id: string;
  readonly lastFour: string;
  readonly providerKind: AIProviderKind;
}

interface AIProviderKeyRecord extends AIProviderKeyMetadata {
  readonly value: string;
}

export class AIProviderKeyVault {
  private readonly keys = new Map<string, AIProviderKeyRecord>();

  public setKey(
    providerKind: AIProviderKind,
    value: string,
    now = new Date(),
  ): AIProviderKeyMetadata {
    const normalizedKey = value.trim();

    if (normalizedKey.length < 12) {
      throw new Error('Provider key is too short.');
    }

    const record: AIProviderKeyRecord = {
      createdAt: now.toISOString(),
      id: `${providerKind}:${crypto.randomUUID()}`,
      lastFour: normalizedKey.slice(-4),
      providerKind,
      value: normalizedKey,
    };

    this.keys.set(providerKind, record);

    return toMetadata(record);
  }

  public getKey(providerKind: AIProviderKind): string | null {
    return this.keys.get(providerKind)?.value ?? null;
  }

  public removeKey(providerKind: AIProviderKind): boolean {
    return this.keys.delete(providerKind);
  }

  public listMetadata(): readonly AIProviderKeyMetadata[] {
    return [...this.keys.values()].map(toMetadata);
  }

  public clear(): void {
    this.keys.clear();
  }
}

function toMetadata(record: AIProviderKeyRecord): AIProviderKeyMetadata {
  return {
    createdAt: record.createdAt,
    id: record.id,
    lastFour: record.lastFour,
    providerKind: record.providerKind,
  };
}
