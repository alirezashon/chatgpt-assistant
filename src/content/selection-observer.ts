import { extractPageContext, getSelectedText } from '@/features/context';
import { requestRuntime } from '@/lib/messaging';
import { throttle } from '@/utils';

import { CONTENT_EVENTS, dispatchContentEvent } from './content-events';

export function installSelectionObserver(): () => void {
  let previousSelection = '';

  const notifySelectionChanged = throttle(() => {
    const selectedText = getSelectedText();

    if (selectedText === previousSelection) {
      return;
    }

    previousSelection = selectedText;

    const context = extractPageContext(selectedText);

    dispatchContentEvent(CONTENT_EVENTS.contextChanged, context);

    if (selectedText.length === 0) {
      return;
    }

    void requestRuntime('content', 'selection.changed', {
      context,
      selectedText,
    }).catch(() => {
      // The extension runtime can be unavailable during reloads; selection UX should stay silent.
    });
  }, 150);

  document.addEventListener('selectionchange', notifySelectionChanged, { passive: true });

  return () => {
    document.removeEventListener('selectionchange', notifySelectionChanged);
  };
}
