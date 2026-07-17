import type { ContextContentBlock, ContextMetadata } from './context-types';

const MAX_TEXT_CHARS = 1800;
const MAX_BLOCKS = 12;

/** Extracts bounded, relevant DOM content without blindly collecting the whole page. */
export class DOMExtractor {
  /** Extracts readable content blocks from the visible document. */
  public extractContent(documentRef: Document = document): readonly ContextContentBlock[] {
    const blocks: ContextContentBlock[] = [];

    for (const element of this.getCandidateElements(documentRef)) {
      const block = elementToBlock(element);

      if (block === null || blocks.some((candidate) => candidate.text === block.text)) {
        continue;
      }

      blocks.push(block);

      if (blocks.length >= MAX_BLOCKS) {
        break;
      }
    }

    return blocks;
  }

  /** Extracts safe page metadata. */
  public extractMetadata(documentRef: Document = document): ContextMetadata {
    const authenticated = detectAuthenticatedState(documentRef);
    const description = readMeta(documentRef, 'description') ?? readMeta(documentRef, 'og:description');
    const language = documentRef.documentElement.lang || undefined;

    return {
      structuredDataTypes: extractStructuredDataTypes(documentRef),
      ...(authenticated === undefined ? {} : { authenticated }),
      ...(description === undefined ? {} : { description }),
      ...(language === undefined ? {} : { language }),
    };
  }

  private getCandidateElements(documentRef: Document): readonly Element[] {
    return [
      ...documentRef.querySelectorAll(
        [
          'article h1',
          'article h2',
          'article p',
          'main h1',
          'main h2',
          'main p',
          'pre',
          'code',
          'table',
          'li',
          'img[alt]',
          'h1',
          'h2',
        ].join(','),
      ),
    ];
  }
}

function elementToBlock(element: Element): ContextContentBlock | null {
  if (!isProbablyVisible(element)) {
    return null;
  }

  if (element instanceof HTMLImageElement) {
    const text = element.alt.trim();

    return text.length === 0
      ? null
      : {
          kind: 'image',
          text: truncate(text),
        };
  }

  const text = normalizeText(element.textContent);

  if (text.length === 0) {
    return null;
  }

  if (element instanceof HTMLTableElement) {
    return {
      kind: 'table',
      text: truncate(text),
    };
  }

  if (element.matches('pre, code')) {
    return {
      kind: 'code',
      text: truncate(text),
    };
  }

  if (element.matches('h1, h2, h3')) {
    return {
      kind: 'heading',
      text: truncate(text),
    };
  }

  if (element.matches('li')) {
    return {
      kind: 'list',
      text: truncate(text),
    };
  }

  return {
    kind: 'paragraph',
    text: truncate(text),
  };
}

function detectAuthenticatedState(documentRef: Document): boolean | undefined {
  const hasLogout = documentRef.querySelector(
    '[href*="logout"], [href*="signout"], [aria-label*="account" i], [aria-label*="profile" i]',
  );

  if (hasLogout !== null) {
    return true;
  }

  const hasLogin = documentRef.querySelector('[href*="login"], [href*="signin"]');

  return hasLogin === null ? undefined : false;
}

function extractStructuredDataTypes(documentRef: Document): readonly string[] {
  return [...documentRef.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap((script) => parseStructuredType(script.textContent))
    .slice(0, 8);
}

function parseStructuredType(value: string): readonly string[] {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.flatMap((entry) => parseStructuredType(JSON.stringify(entry)));
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const type = (parsed as Readonly<Record<string, unknown>>)['@type'];

      return typeof type === 'string' ? [type] : [];
    }
  } catch {
    return [];
  }

  return [];
}

function readMeta(documentRef: Document, name: string): string | undefined {
  const element = documentRef.querySelector(
    `meta[name="${name}"], meta[property="${name}"]`,
  );
  const content = element?.getAttribute('content')?.trim();

  return content === undefined || content.length === 0 ? undefined : truncate(content);
}

function isProbablyVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function truncate(value: string): string {
  return value.length > MAX_TEXT_CHARS ? `${value.slice(0, MAX_TEXT_CHARS)}...` : value;
}
