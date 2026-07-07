import { ConversationSelectors } from '@/features/conversations/conversation-selectors';

export type ConversationObserverCallback = () => void;
export type ConversationObserverDisconnect = () => void;

export interface ConversationObserverOptions {
  readonly debounceMs?: number;
  readonly document: Document;
  readonly onChange: ConversationObserverCallback;
  readonly window: Window;
}

export class ConversationObserver {
  private readonly debounceMs: number;
  private readonly document: Document;
  private readonly onChange: ConversationObserverCallback;
  private readonly selectors: ConversationSelectors;
  private readonly window: Window;
  private animationFrameId: number | null = null;
  private mutationObserver: MutationObserver | null = null;
  private timeoutId: number | null = null;
  private unpatchHistory: ConversationObserverDisconnect | null = null;

  public constructor(options: ConversationObserverOptions) {
    this.debounceMs = options.debounceMs ?? 150;
    this.document = options.document;
    this.onChange = options.onChange;
    this.selectors = new ConversationSelectors(options.document);
    this.window = options.window;
  }

  public start(): ConversationObserverDisconnect {
    this.disconnect();

    const target = this.document.documentElement;

    this.mutationObserver = new MutationObserver((mutations) => {
      if (this.shouldIgnoreMutations(mutations)) {
        return;
      }

      this.scheduleChange();
    });

    this.mutationObserver.observe(target, {
      attributeFilter: ['aria-current', 'href', 'title'],
      attributes: true,
      childList: true,
      subtree: true,
    });

    this.window.addEventListener('popstate', this.handleNavigation);
    this.unpatchHistory = this.patchHistory();

    return () => {
      this.disconnect();
    };
  }

  public disconnect(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.window.removeEventListener('popstate', this.handleNavigation);
    this.unpatchHistory?.();
    this.unpatchHistory = null;

    if (this.timeoutId !== null) {
      this.window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.animationFrameId !== null) {
      this.window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private readonly handleNavigation = () => {
    this.scheduleChange();
  };

  private patchHistory(): ConversationObserverDisconnect {
    const history = this.window.history;
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      const result = originalPushState(...args);
      this.scheduleChange();

      return result;
    };

    history.replaceState = (...args) => {
      const result = originalReplaceState(...args);
      this.scheduleChange();

      return result;
    };

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }

  private scheduleChange(): void {
    if (this.timeoutId !== null) {
      this.window.clearTimeout(this.timeoutId);
    }

    this.timeoutId = this.window.setTimeout(() => {
      this.animationFrameId = this.window.requestAnimationFrame(() => {
        this.timeoutId = null;
        this.animationFrameId = null;
        this.onChange();
      });
    }, this.debounceMs);
  }

  private shouldIgnoreMutations(mutations: readonly MutationRecord[]): boolean {
    return mutations.every((mutation) => this.selectors.isInsideExtensionHost(mutation.target));
  }
}
