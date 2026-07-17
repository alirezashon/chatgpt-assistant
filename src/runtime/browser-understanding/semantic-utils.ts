import type { SemanticRisk } from './browser-understanding-types';

/** Clamps a number to 0..1. */
export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Returns stable non-cryptographic hash. */
export function stableHash(value: string): string {
  let hash = 2_166_136_261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(16);
}

/** Converts risk to sortable score. */
export function riskScore(risk: SemanticRisk): number {
  if (risk === 'low') {
    return 0;
  }

  if (risk === 'medium') {
    return 1;
  }

  if (risk === 'high') {
    return 2;
  }

  return 3;
}

/** Normalizes text for matching. */
export function normalizeText(value: string): string {
  return value.toLowerCase().replaceAll(/\s+/g, ' ').trim();
}

/** Tokenizes text into meaningful query terms. */
export function tokenize(value: string): readonly string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1);
}
