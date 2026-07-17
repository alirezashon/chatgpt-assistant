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

export type BrowserApplication =
  | 'generic-web'
  | 'github'
  | 'gmail'
  | 'google-docs'
  | 'jira'
  | 'notion'
  | 'pdf-viewer'
  | 'stackoverflow'
  | 'youtube';

export type ContextEntityType =
  | 'article'
  | 'code-block'
  | 'email-thread'
  | 'error'
  | 'image'
  | 'issue'
  | 'pull-request'
  | 'repository'
  | 'table'
  | 'video';

export interface FocusedElementContext {
  readonly isEditable: boolean;
  readonly tagName: string;
  readonly textValue?: string;
}

export interface ContextSelection {
  readonly codeLike: boolean;
  readonly editable: boolean;
  readonly kind: 'code' | 'error' | 'plain-text' | 'structured-data';
  readonly length: number;
  readonly text: string;
}

export interface ContextEntity {
  readonly confidence: number;
  readonly label: string;
  readonly type: ContextEntityType;
  readonly value: string;
}

export interface ContextContentBlock {
  readonly kind: 'code' | 'heading' | 'image' | 'list' | 'paragraph' | 'table';
  readonly language?: string;
  readonly text: string;
}

export interface ContextMetadata {
  readonly authenticated?: boolean;
  readonly description?: string;
  readonly language?: string;
  readonly structuredDataTypes: readonly string[];
}

export interface ContextPrivacy {
  readonly containsSensitiveFields: boolean;
  readonly dataClasses: readonly string[];
  readonly redactions: readonly string[];
  readonly safeForAI: boolean;
}

export interface ContextPermissionStatus {
  readonly active: boolean;
  readonly label: string;
  readonly permission: string;
}

export interface ContextActionCandidate {
  readonly actionId: string;
  readonly confidence: number;
  readonly reason: string;
}

export interface PageContextSnapshot {
  readonly application: BrowserApplication;
  readonly availableActions: readonly ContextActionCandidate[];
  readonly capturedAt: string;
  readonly content: readonly ContextContentBlock[];
  readonly domain: string;
  readonly entities: readonly ContextEntity[];
  readonly focusedElement?: FocusedElementContext;
  readonly hostname: string;
  readonly metadata: ContextMetadata;
  readonly pageKind: PageKind;
  readonly permissions: readonly ContextPermissionStatus[];
  readonly privacy: ContextPrivacy;
  readonly selection?: ContextSelection;
  readonly selectedText?: string;
  readonly title: string;
  readonly url: string;
}
