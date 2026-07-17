import type { AIResponse } from './ai-types';

/** AI cache entry. */
export interface AICacheEntry {
  /** Cached response. */
  readonly response: AIResponse;
  /** Expiration timestamp. */
  readonly expiresAt: number;
}

/** Privacy-aware in-memory AI response cache. */
export class AICacheManager {
  private readonly entries = new Map<string, AICacheEntry>();

  /** Reads a non-expired response. */
  public get(key: string, now = Date.now()): AIResponse | undefined {
    const entry = this.entries.get(key);

    if (entry === undefined) {
      return undefined;
    }

    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      return undefined;
    }

    return {
      ...entry.response,
      cached: true,
    };
  }

  /** Stores a response. */
  public set(key: string, response: AIResponse, ttlMs: number, now = Date.now()): void {
    this.entries.set(key, {
      expiresAt: now + ttlMs,
      response,
    });
  }

  /** Builds a deterministic cache key without raw sensitive payloads. */
  public key(parts: readonly string[]): string {
    return parts.map((part) => stableHash(part)).join('|');
  }
}

function stableHash(value: string): string {
  let hash = 2_166_136_261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(16);
}
