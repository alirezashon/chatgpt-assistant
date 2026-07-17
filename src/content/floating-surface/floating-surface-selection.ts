import type { FloatingSurfaceSelection } from './floating-surface-types';

const MIN_SELECTION_LENGTH = 2;
const CODE_PATTERN =
  /[{}();]|=>|<\/?[a-z][\s\S]*>|^\s*(const|let|var|function|class|import|export|def|SELECT)\b/m;

/** Extracts a normalized selection from the current document. */
export function readCurrentSelection(): FloatingSurfaceSelection | null {
  const selection = window.getSelection();

  if (selection === null || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const text = selection.toString().trim();

  if (!isValidSelectionText(text)) {
    return null;
  }

  const rects = getSelectionRects(selection);
  const boundingRect = getBoundingRect(rects);

  if (boundingRect === null) {
    return null;
  }

  const anchorElement = getElementFromNode(selection.anchorNode);

  return {
    boundingRect,
    codeLike: isCodeLike(text, anchorElement),
    editable: isEditableElement(anchorElement),
    rects,
    text,
  };
}

/** Returns true when selected text is useful enough for action suggestions. */
export function isValidSelectionText(text: string): boolean {
  return text.trim().length >= MIN_SELECTION_LENGTH;
}

function getSelectionRects(selection: Selection): readonly DOMRectReadOnly[] {
  const rects: DOMRectReadOnly[] = [];

  for (let index = 0; index < selection.rangeCount; index += 1) {
    const range = selection.getRangeAt(index);

    for (const rect of range.getClientRects()) {
      if (rect.width > 0 && rect.height > 0) {
        rects.push(rect);
      }
    }
  }

  return rects;
}

function getBoundingRect(rects: readonly DOMRectReadOnly[]): DOMRectReadOnly | null {
  if (rects.length === 0) {
    return null;
  }

  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

  return DOMRectReadOnly.fromRect({
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  });
}

function getElementFromNode(node: Node | null): Element | null {
  if (node instanceof Element) {
    return node;
  }

  return node?.parentElement ?? null;
}

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return (
    element.isContentEditable ||
    element.closest('[contenteditable="true"], textarea, input') !== null
  );
}

function isCodeLike(text: string, element: Element | null): boolean {
  if (element?.closest('pre, code, [class*="code"], [class*="syntax"]') !== null) {
    return true;
  }

  return CODE_PATTERN.test(text);
}
