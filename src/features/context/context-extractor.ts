import { contextEngine } from './context-engine';
import type { PageContextSnapshot } from './context-types';

/** Extracts the current page context through the Context Intelligence Engine. */
export function extractPageContext(selectedText = getSelectedText()): PageContextSnapshot {
  return contextEngine.detect({ selectedText });
}

/** Returns the current selected text. */
export function getSelectedText(): string {
  return window.getSelection()?.toString().trim() ?? '';
}
