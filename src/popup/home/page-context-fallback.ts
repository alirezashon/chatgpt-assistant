import {
  createMinimalPageContext,
  type PageContextSnapshot,
  type PageKind,
} from '@/features/context';
import { executeScript } from '@/lib/chrome/chrome-api';

interface ScrapedPageContext {
  readonly codeBlocks: readonly string[];
  readonly description: string;
  readonly headings: readonly string[];
  readonly hostname: string;
  readonly imageCount: number;
  readonly language: string;
  readonly listItems: readonly string[];
  readonly messageCount: number;
  readonly paragraphs: readonly string[];
  readonly title: string;
  readonly url: string;
  readonly videoCount: number;
}

/** Captures a bounded page context when the content script cannot answer. */
export async function capturePageContextFallback(
  tabId: number,
): Promise<PageContextSnapshot | null> {
  try {
    const [result] = await executeScript<[], ScrapedPageContext>({
      target: { tabId },
      func: scrapeVisiblePageContext,
    });
    const scraped = result?.result;

    if (scraped === undefined || scraped.url.length === 0) {
      return null;
    }

    const content = [
      ...scraped.headings.map((text) => ({ kind: 'heading' as const, text })),
      ...scraped.paragraphs.map((text) => ({ kind: 'paragraph' as const, text })),
      ...(scraped.listItems.length === 0
        ? []
        : [{ kind: 'list' as const, text: scraped.listItems.join('\n') }]),
      ...scraped.codeBlocks.map((text) => ({ kind: 'code' as const, text })),
    ].slice(0, 12);

    return createMinimalPageContext({
      capturedAt: new Date().toISOString(),
      content,
      hostname: scraped.hostname,
      metadata: {
        description: scraped.description,
        language: scraped.language,
        structuredDataTypes: [],
      },
      availableActions: [
        ...(scraped.imageCount > 0
          ? [{ actionId: 'image.edit', confidence: 0.68, reason: 'Page contains images' }]
          : []),
        ...(scraped.videoCount > 0
          ? [{ actionId: 'video.cut', confidence: 0.7, reason: 'Page contains video' }]
          : []),
      ],
      pageKind: inferFallbackPageKind(scraped),
      title: scraped.title,
      url: scraped.url,
    });
  } catch {
    return null;
  }
}

function scrapeVisiblePageContext(): ScrapedPageContext {
  const textFrom = (selector: string, limit: number): readonly string[] =>
    [...document.querySelectorAll(selector)]
      .map((element) => element.textContent.trim())
      .filter((text) => text.length > 0)
      .slice(0, limit);

  return {
    codeBlocks: textFrom('pre code, code', 4),
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    headings: textFrom('h1, h2, h3', 8),
    hostname: location.hostname,
    imageCount: document.querySelectorAll('img[src], picture source[srcset]').length,
    language: document.documentElement.lang,
    listItems: textFrom('li', 12),
    messageCount: document.querySelectorAll('[data-message-author-role], article').length,
    paragraphs: textFrom('article p, main p, p', 8),
    title: document.title,
    url: location.href,
    videoCount: document.querySelectorAll('video, source[type^="video/"]').length,
  };
}

function inferFallbackPageKind(context: ScrapedPageContext): PageKind {
  const url = context.url.toLowerCase();
  const hostname = context.hostname.toLowerCase();

  if (url.endsWith('.pdf')) {
    return 'pdf';
  }

  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    return context.messageCount > 0 ? 'chat-thread' : 'chat-empty';
  }

  if (hostname.includes('github.com') || context.codeBlocks.length > 0) {
    return 'code';
  }

  if (hostname.includes('mail.google.com') || hostname.includes('outlook')) {
    return 'email';
  }

  if (hostname.includes('youtube.com')) {
    return 'video';
  }

  if (context.paragraphs.length >= 2 || context.headings.length > 0) {
    return 'article';
  }

  return 'generic';
}
