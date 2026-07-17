import { createDisposable, debounce, type Disposable } from '@/runtime/utils';

/** Observes DOM mutations and SPA navigation signals without forcing full page rescans per mutation. */
export class DomChangeObserver {
  /** Starts observing a document. */
  public observe(document: Document, listener: () => void, debounceMs = 100): Disposable {
    const notify = debounce(listener, debounceMs);
    const observer = new MutationObserver(() => {
      notify();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);
    const navigationListener = () => {
      notify();
    };

    history.pushState = function pushState(...args) {
      const result = originalPushState(...args);
      navigationListener();
      return result;
    };
    history.replaceState = function replaceState(...args) {
      const result = originalReplaceState(...args);
      navigationListener();
      return result;
    };
    window.addEventListener('popstate', navigationListener);

    return createDisposable(() => {
      observer.disconnect();
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', navigationListener);
    });
  }
}
