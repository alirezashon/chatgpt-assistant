import type { FocusedElementContext, PageContextSnapshot, PageKind } from './context-types';

export function extractPageContext(selectedText = getSelectedText()): PageContextSnapshot {
  const focusedElement = extractFocusedElementContext();

  return {
    capturedAt: new Date().toISOString(),
    hostname: window.location.hostname,
    pageKind: inferPageKind(window.location.href),
    title: document.title,
    url: window.location.href,
    ...(focusedElement === undefined ? {} : { focusedElement }),
    ...(selectedText.length > 0 ? { selectedText } : {}),
  };
}

export function getSelectedText(): string {
  return window.getSelection()?.toString().trim() ?? '';
}

function extractFocusedElementContext(): FocusedElementContext | undefined {
  const activeElement = document.activeElement;

  if (!(activeElement instanceof HTMLElement)) {
    return undefined;
  }

  const isEditable =
    activeElement.isContentEditable ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLInputElement;

  const textValue = isEditable ? getElementTextValue(activeElement) : undefined;

  return {
    isEditable,
    tagName: activeElement.tagName.toLowerCase(),
    ...(textValue === undefined ? {} : { textValue }),
  };
}

function getElementTextValue(element: HTMLElement): string {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    return element.value;
  }

  return element.innerText.trim();
}

function inferPageKind(url: string): PageKind {
  const hostname = window.location.hostname;

  if (url.endsWith('.pdf') || document.contentType === 'application/pdf') {
    return 'pdf';
  }

  if (hostname.includes('github.com') || hostname.includes('stackoverflow.com')) {
    return 'code';
  }

  if (hostname.includes('mail.google.com') || hostname.includes('outlook.live.com')) {
    return 'email';
  }

  if (hostname.includes('youtube.com')) {
    return 'video';
  }

  if (
    hostname.includes('linkedin.com') ||
    hostname.includes('twitter.com') ||
    hostname.includes('x.com')
  ) {
    return 'social';
  }

  if (hostname.includes('jira') || hostname.includes('linear.app')) {
    return 'issue-tracker';
  }

  if (document.querySelector('article') !== null) {
    return 'article';
  }

  return 'generic';
}
