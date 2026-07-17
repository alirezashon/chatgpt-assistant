export type PageKind =
  | 'article'
  | 'code'
  | 'document'
  | 'email'
  | 'generic'
  | 'issue-tracker'
  | 'pdf'
  | 'social'
  | 'video';

export interface FocusedElementContext {
  readonly isEditable: boolean;
  readonly tagName: string;
  readonly textValue?: string;
}

export interface PageContextSnapshot {
  readonly capturedAt: string;
  readonly focusedElement?: FocusedElementContext;
  readonly hostname: string;
  readonly pageKind: PageKind;
  readonly selectedText?: string;
  readonly title: string;
  readonly url: string;
}
