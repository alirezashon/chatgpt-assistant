import { FIRST_PARTY_ACTIONS } from '@/features/actions';

import { ContextAdapterRegistry } from './adapter-registry';
import { ContextActionRanker } from './action-ranker';
import { contextMemory } from './context-memory';
import { DOMExtractor } from './dom-extractor';
import { EntityDetector } from './entity-detector';
import { ContextPermissionManager } from './permission-manager';
import { PrivacyFilter } from './privacy-filter';
import type {
  ContextSelection,
  FocusedElementContext,
  PageContextSnapshot,
} from './context-types';

/** Browser understanding layer for the current page workspace. */
export class ContextEngine {
  private readonly adapters = new ContextAdapterRegistry();
  private readonly dom = new DOMExtractor();
  private readonly entities = new EntityDetector();
  private readonly permissions = new ContextPermissionManager();
  private readonly privacy = new PrivacyFilter();
  private readonly ranker = new ContextActionRanker();

  /** Detects the current page context using adapters and bounded extraction. */
  public detect(input: {
    readonly documentRef?: Document;
    readonly selectedText?: string;
    readonly url?: string;
  } = {}): PageContextSnapshot {
    const documentRef = input.documentRef ?? document;
    const url = new URL(input.url ?? documentRef.location.href);
    const selectedText = input.selectedText ?? getSelectedTextFromDocument(documentRef);
    const adapter = this.adapters.match({ documentRef, url });
    const adapterResult = adapter.extract({ documentRef, selectedText, url });
    const content = this.dom.extractContent(documentRef);
    const metadata = this.dom.extractMetadata(documentRef);
    const focusedElement = extractFocusedElementContext(documentRef);
    const selection = createSelection(selectedText, focusedElement);
    const detectedEntities = [
      ...(adapterResult.entities ?? []),
      ...this.entities.detect({
        content,
        hostname: url.hostname,
        pathname: url.pathname,
        selectedText,
        title: documentRef.title,
      }),
    ];
    const privacy = this.privacy.inspect({
      content,
      documentRef,
      hostname: url.hostname,
      selectedText,
    });
    const baseContext = {
      application: adapterResult.application,
      capturedAt: new Date().toISOString(),
      content: content.map((block) => ({
        ...block,
        text: this.privacy.redactText(block.text),
      })),
      domain: url.hostname,
      entities: detectedEntities,
      hostname: url.hostname,
      metadata,
      pageKind: adapterResult.pageKind,
      permissions: this.permissions.getActivePermissions(),
      privacy,
      title: documentRef.title,
      url: url.href,
      ...(focusedElement === undefined ? {} : { focusedElement }),
      ...(selectedText.length === 0 ? {} : { selectedText: this.privacy.redactText(selectedText) }),
      ...(selection === undefined ? {} : { selection }),
    } satisfies Omit<PageContextSnapshot, 'availableActions'>;
    const snapshot = {
      ...baseContext,
      availableActions: this.rankRelevantActions({
        adapterActions: adapterResult.availableActions,
        context: baseContext,
      }),
    } satisfies PageContextSnapshot;

    contextMemory.remember(snapshot);

    return snapshot;
  }

  /** Clears temporary page context memory. */
  public clearMemory(): void {
    contextMemory.clear();
  }

  private rankRelevantActions(input: {
    readonly adapterActions: PageContextSnapshot['availableActions'];
    readonly context: Omit<PageContextSnapshot, 'availableActions'>;
  }): PageContextSnapshot['availableActions'] {
    const ranked = this.ranker.rank(input);
    const knownActionIds = new Set(FIRST_PARTY_ACTIONS.map((action) => action.id));

    return ranked.filter((candidate) => knownActionIds.has(candidate.actionId));
  }
}

function getSelectedTextFromDocument(documentRef: Document): string {
  return documentRef.getSelection()?.toString().trim() ?? '';
}

function extractFocusedElementContext(documentRef: Document): FocusedElementContext | undefined {
  const activeElement = documentRef.activeElement;

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

function createSelection(
  selectedText: string,
  focusedElement: FocusedElementContext | undefined,
): ContextSelection | undefined {
  if (selectedText.length === 0) {
    return undefined;
  }

  const kind = selectionKind(selectedText);

  return {
    codeLike: kind === 'code' || kind === 'error',
    editable: focusedElement?.isEditable === true,
    kind,
    length: selectedText.length,
    text: selectedText,
  };
}

function selectionKind(value: string): ContextSelection['kind'] {
  if (/\b(error|exception|traceback|stack trace|cannot read|undefined)\b/iu.test(value)) {
    return 'error';
  }

  if (/[{};=]|=>|\b(function|const|class|select|from|where)\b/iu.test(value)) {
    return 'code';
  }

  if (/^\s*[[{]/u.test(value) || /\t|,/u.test(value)) {
    return 'structured-data';
  }

  return 'plain-text';
}

function getElementTextValue(element: HTMLElement): string {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    return element.value;
  }

  return element.innerText.trim();
}

export const contextEngine = new ContextEngine();
