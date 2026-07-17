import type { SemanticElementRole, SemanticElementState } from './browser-understanding-types';

/** Accessibility metadata extracted from DOM-accessible attributes. */
export interface AccessibilityNodeSnapshot {
  /** ARIA/native role. */
  readonly role: SemanticElementRole;
  /** Accessible name. */
  readonly name: string;
  /** State. */
  readonly state: SemanticElementState;
  /** Keyboard accessible. */
  readonly keyboardAccessible: boolean;
}

/** Extracts role, name, state, hierarchy hints, and keyboard accessibility. */
export class AccessibilityAnalyzer {
  /** Extracts accessibility metadata for an element. */
  public analyze(element: Element): AccessibilityNodeSnapshot {
    return {
      keyboardAccessible: this.isKeyboardAccessible(element),
      name: this.getName(element),
      role: this.getRole(element),
      state: this.getState(element),
    };
  }

  private getRole(element: Element): SemanticElementRole {
    const explicit = element.getAttribute('role');

    if (explicit !== null) {
      return mapRole(explicit);
    }

    const tagName = element.tagName.toLowerCase();

    if (tagName === 'button') {
      return 'button';
    }

    if (tagName === 'a') {
      return 'link';
    }

    if (['input', 'select', 'textarea'].includes(tagName)) {
      return 'input';
    }

    if (tagName === 'form') {
      return 'form';
    }

    if (tagName === 'nav') {
      return 'navigation';
    }

    if (tagName === 'table') {
      return 'table';
    }

    if (tagName === 'dialog') {
      return 'dialog';
    }

    if (tagName === 'img') {
      return 'image';
    }

    if (['audio', 'video'].includes(tagName)) {
      return 'media';
    }

    if (tagName === 'pre' || tagName === 'code') {
      return 'code-block';
    }

    return 'text';
  }

  private getName(element: Element): string {
    const aria = element.getAttribute('aria-label');

    if (aria !== null && aria.trim().length > 0) {
      return aria.trim();
    }

    const labelledBy = element.getAttribute('aria-labelledby');

    if (labelledBy !== null) {
      const label = labelledBy
        .split(/\s+/)
        .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? '')
        .join(' ')
        .trim();

      if (label.length > 0) {
        return label;
      }
    }

    if (
      element instanceof HTMLInputElement &&
      element.labels !== null &&
      element.labels.length > 0
    ) {
      return [...element.labels]
        .map((label) => label.textContent)
        .join(' ')
        .trim();
    }

    const title = element.getAttribute('title');
    return (title ?? element.textContent).trim().replaceAll(/\s+/g, ' ');
  }

  private getState(element: Element): SemanticElementState {
    const htmlElement = element instanceof HTMLElement ? element : undefined;

    const expanded = getAriaBoolean(element, 'aria-expanded');

    return {
      disabled:
        element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
      ...(expanded === undefined ? {} : { expanded }),
      focused: element.ownerDocument.activeElement === element,
      hidden:
        element.hasAttribute('hidden') ||
        element.getAttribute('aria-hidden') === 'true' ||
        htmlElement?.style.display === 'none',
      redacted: false,
      required:
        element.hasAttribute('required') || element.getAttribute('aria-required') === 'true',
      selected:
        element.getAttribute('aria-selected') === 'true' ||
        element.getAttribute('aria-checked') === 'true' ||
        (element instanceof HTMLInputElement && element.checked),
    };
  }

  private isKeyboardAccessible(element: Element): boolean {
    if (element instanceof HTMLElement && element.tabIndex >= 0) {
      return true;
    }

    return ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
  }
}

function mapRole(role: string): SemanticElementRole {
  if (['button', 'link', 'menu', 'navigation', 'table', 'dialog'].includes(role)) {
    return role as SemanticElementRole;
  }

  if (role === 'textbox' || role === 'combobox' || role === 'checkbox' || role === 'radio') {
    return 'input';
  }

  return 'unknown';
}

function getAriaBoolean(element: Element, name: string): boolean | undefined {
  const value = element.getAttribute(name);

  if (value === null) {
    return undefined;
  }

  return value === 'true';
}
