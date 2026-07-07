import type { EntityId } from '@/shared/types';

const CONVERSATION_PATH_PATTERNS: readonly RegExp[] = [
  /^\/c\/(?<id>[^/?#]+)/u,
  /^\/chat\/(?<id>[^/?#]+)/u,
];

export function normalizeConversationTitle(title: string): string {
  const normalizedTitle = title.trim().replace(/\s+/gu, ' ');

  return normalizedTitle.length > 0 ? normalizedTitle : 'Untitled conversation';
}

export function normalizeConversationUrl(url: string, baseUrl: string): string | null {
  try {
    const parsedUrl = new URL(url, baseUrl);
    parsedUrl.hash = '';

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function extractConversationIdFromUrl(url: string, baseUrl: string): EntityId | null {
  const normalizedUrl = normalizeConversationUrl(url, baseUrl);

  if (normalizedUrl === null) {
    return null;
  }

  const parsedUrl = new URL(normalizedUrl);

  for (const pattern of CONVERSATION_PATH_PATTERNS) {
    const match = pattern.exec(parsedUrl.pathname);
    const id = match?.groups?.['id'];

    if (id !== undefined && id.length > 0) {
      return decodeURIComponent(id);
    }
  }

  return null;
}

export function createIsoTimestamp(now: () => Date): string {
  return now().toISOString();
}
