import type {
  BrowserApplication,
  ContextActionCandidate,
  ContextEntity,
  PageKind,
} from '../context-types';

/** Result from a page context adapter. */
export interface ContextAdapterResult {
  readonly application: BrowserApplication;
  readonly availableActions: readonly ContextActionCandidate[];
  readonly entities?: readonly ContextEntity[];
  readonly pageKind: PageKind;
}

/** Modular website adapter contract. */
export interface ContextAdapter {
  readonly id: string;
  detect(input: { readonly documentRef: Document; readonly url: URL }): boolean;
  extract(input: {
    readonly documentRef: Document;
    readonly selectedText: string;
    readonly url: URL;
  }): ContextAdapterResult;
  requiredPermissions(): readonly string[];
}

export function actionCandidate(
  actionId: string,
  confidence: number,
  reason: string,
): ContextActionCandidate {
  return {
    actionId,
    confidence,
    reason,
  };
}
