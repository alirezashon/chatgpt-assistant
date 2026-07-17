import type { MemoryCandidate, MemoryObservation, MemoryType } from './memory-types';

/** Extracts useful memory candidates from observations. */
export class MemoryExtractionEngine {
  /** Extracts candidates. Returns empty when signal is too weak. */
  public extract(observation: MemoryObservation): readonly MemoryCandidate[] {
    const text = observation.text.trim();

    if (text.length < 8) {
      return [];
    }

    const explicitPreference = extractPreference(text);

    if (explicitPreference !== undefined) {
      return [
        {
          content: explicitPreference.content,
          sensitivity: observation.sensitivity,
          tags: explicitPreference.tags,
          title: explicitPreference.title,
          type: 'preference',
          value: explicitPreference.value,
        },
      ];
    }

    const type = inferType(text);

    return [
      {
        content: text,
        sensitivity: observation.sensitivity,
        tags: inferTags(text),
        title: inferTitle(text),
        type,
        value: {
          text,
        },
      },
    ];
  }
}

function extractPreference(text: string): MemoryCandidate | undefined {
  const lower = text.toLowerCase();
  const match = /(?:i|user)\s+(?:always\s+)?(?:prefer|use|like|want)\s+(.+)/i.exec(text);

  if (match?.[1] === undefined && !lower.includes('always use')) {
    return undefined;
  }

  const value = match?.[1]?.trim() ?? text.trim();

  return {
    content: `User prefers ${value}.`,
    sensitivity: 'personal',
    tags: inferTags(value),
    title: `Preference: ${value}`,
    type: 'preference',
    value: {
      preference: value,
    },
  };
}

function inferType(text: string): MemoryType {
  const lower = text.toLowerCase();

  if (
    lower.includes('current task') ||
    lower.includes('current page') ||
    lower.includes('current workflow')
  ) {
    return 'working';
  }

  if (lower.includes('fixed') || lower.includes('debugged') || lower.includes('yesterday')) {
    return 'episodic';
  }

  if (lower.includes('usually') || lower.includes('workflow') || lower.includes('deploy')) {
    return 'procedural';
  }

  return 'semantic';
}

function inferTags(text: string): readonly string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];

  for (const tag of [
    'typescript',
    'javascript',
    'react',
    'vue',
    'docker',
    'github',
    'jira',
    'mongodb',
    'api',
  ]) {
    if (lower.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}

function inferTitle(text: string): string {
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}
