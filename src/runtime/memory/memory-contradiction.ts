import type { MemoryItem, MemoryRelationship } from './memory-types';

/** Detects contradictory memories and creates conflict relationships. */
export class MemoryContradictionDetector {
  /** Returns conflict relationships for a new memory. */
  public detect(item: MemoryItem, existing: readonly MemoryItem[]): readonly MemoryRelationship[] {
    if (item.type !== 'preference') {
      return [];
    }

    const subject = getPreferenceSubject(item.content);

    if (subject === undefined) {
      return [];
    }

    return existing
      .filter((candidate) => candidate.type === 'preference')
      .filter((candidate) => candidate.id !== item.id)
      .filter((candidate) => getPreferenceSubject(candidate.content) === subject)
      .filter((candidate) => candidate.content !== item.content)
      .map((candidate) => ({
        confidence: 0.85,
        from: item.id,
        id: `${item.id}:conflicts:${candidate.id}`,
        to: candidate.id,
        type: 'conflicts_with' as const,
      }));
  }
}

function getPreferenceSubject(content: string): string | undefined {
  const lower = content.toLowerCase();

  if (lower.includes('typescript') || lower.includes('javascript')) {
    return 'programming-language';
  }

  if (lower.includes('react') || lower.includes('vue')) {
    return 'frontend-framework';
  }

  if (lower.includes('docker') || lower.includes('kubernetes')) {
    return 'deployment-tooling';
  }

  return undefined;
}
