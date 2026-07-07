export const CONVERSATION_SELECTOR_VALUES = {
  activeConversationLinks: [
    'a[aria-current="page"][href*="/c/"]',
    'a[aria-current="page"][href*="/chat/"]',
    'a.bg-token-sidebar-surface-secondary[href*="/c/"]',
    'a.bg-token-sidebar-surface-secondary[href*="/chat/"]',
  ],
  conversationLinks: ['a[href*="/c/"]', 'a[href*="/chat/"]'],
  extensionHost: '#chatgpt-workspace-root',
  titleCandidates: ['main h1', 'h1', 'title'],
} as const;

export class ConversationSelectors {
  private readonly document: Document;

  public constructor(document: Document) {
    this.document = document;
  }

  public getActiveConversationLink(): HTMLAnchorElement | null {
    return this.queryFirstAnchor(CONVERSATION_SELECTOR_VALUES.activeConversationLinks);
  }

  public getConversationLinks(): readonly HTMLAnchorElement[] {
    return this.queryAnchors(CONVERSATION_SELECTOR_VALUES.conversationLinks);
  }

  public getDocumentTitle(): string {
    return this.document.title;
  }

  public isInsideExtensionHost(node: Node): boolean {
    const hostElement = this.document.querySelector(CONVERSATION_SELECTOR_VALUES.extensionHost);

    return hostElement?.contains(node) ?? false;
  }

  private queryAnchors(selectors: readonly string[]): readonly HTMLAnchorElement[] {
    const anchors = selectors.flatMap((selector) =>
      Array.from(this.document.querySelectorAll<HTMLAnchorElement>(selector)),
    );

    return Array.from(new Set(anchors));
  }

  private queryFirstAnchor(selectors: readonly string[]): HTMLAnchorElement | null {
    for (const selector of selectors) {
      const anchor = this.document.querySelector<HTMLAnchorElement>(selector);

      if (anchor !== null) {
        return anchor;
      }
    }

    return null;
  }
}
