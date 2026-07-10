import type {
  ConversationCandidate,
  ConversationDetectionContext,
  ConversationSnapshot,
} from '@/features/conversations/conversation-types';
import {
  createIsoTimestamp,
  extractConversationIdFromUrl,
  normalizeConversationTitle,
  normalizeConversationUrl,
} from '@/features/conversations/conversation-utils';
import { ConversationSelectors } from '@/features/conversations/conversation-selectors';

export class ConversationMapper {
  public createSnapshot(context: ConversationDetectionContext): ConversationSnapshot {
    const capturedAt = createIsoTimestamp(context.now);
    const selectors = new ConversationSelectors(context.document);
    const activeConversationId = extractConversationIdFromUrl(
      context.location.href,
      context.location.origin,
    );
    const activeLink = selectors.getActiveConversationLink();
    const conversationLinks = selectors.getConversationLinks();
    const candidates = new Map<string, ConversationCandidate>();

    for (const anchor of conversationLinks) {
      const candidate = this.mapAnchorToCandidate(
        anchor,
        context,
        activeConversationId,
        capturedAt,
      );

      if (candidate !== null) {
        candidates.set(candidate.id, candidate);
      }
    }

    if (activeConversationId !== null) {
      const activeCandidate =
        activeLink === null
          ? this.mapActiveUrlToCandidate(context, activeConversationId, capturedAt)
          : this.mapAnchorToCandidate(activeLink, context, activeConversationId, capturedAt);

      if (activeCandidate !== null) {
        candidates.set(activeCandidate.id, {
          ...activeCandidate,
          isActive: true,
        });
      }
    }

    return {
      activeConversationId,
      capturedAt,
      conversationListObserved: conversationLinks.length > 0,
      conversations: Array.from(candidates.values()),
    };
  }

  private mapAnchorToCandidate(
    anchor: HTMLAnchorElement,
    context: ConversationDetectionContext,
    activeConversationId: string | null,
    capturedAt: string,
  ): ConversationCandidate | null {
    const normalizedUrl = normalizeConversationUrl(
      anchor.getAttribute('href') ?? anchor.href,
      context.location.origin,
    );

    if (normalizedUrl === null) {
      return null;
    }

    const id = extractConversationIdFromUrl(normalizedUrl, context.location.origin);

    if (id === null) {
      return null;
    }

    return {
      id,
      isActive: id === activeConversationId,
      metadata: {
        detectedFrom: 'conversation-list',
        lastSeenAt: capturedAt,
      },
      title: normalizeConversationTitle(getAnchorTitle(anchor)),
      url: normalizedUrl,
    };
  }

  private mapActiveUrlToCandidate(
    context: ConversationDetectionContext,
    activeConversationId: string,
    capturedAt: string,
  ): ConversationCandidate | null {
    const normalizedUrl = normalizeConversationUrl(context.location.href, context.location.origin);

    if (normalizedUrl === null) {
      return null;
    }

    return {
      id: activeConversationId,
      isActive: true,
      metadata: {
        detectedFrom: 'active-url',
        lastSeenAt: capturedAt,
      },
      title: normalizeConversationTitle(
        new ConversationSelectors(context.document)
          .getPageTitleCandidate()
          .replace(/ - ChatGPT$/u, '')
          .replace(/^ChatGPT - /u, ''),
      ),
      url: normalizedUrl,
    };
  }
}

function getAnchorTitle(anchor: HTMLAnchorElement): string {
  const textTitle = anchor.textContent.trim();

  if (textTitle.length > 0) {
    return textTitle;
  }

  return anchor.getAttribute('aria-label') ?? anchor.title;
}
