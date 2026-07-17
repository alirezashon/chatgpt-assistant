/** Stable Browser Understanding Engine version. */
export const BROWSER_UNDERSTANDING_VERSION = '1.0.0';

/** JSON-like value exported by the perception layer. */
export type BrowserUnderstandingValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: BrowserUnderstandingValue }
  | readonly BrowserUnderstandingValue[];

/** Semantic node kind. */
export type SemanticNodeKind =
  'action' | 'component' | 'content' | 'element' | 'page' | 'relationship' | 'section' | 'state';

/** Semantic element role. */
export type SemanticElementRole =
  | 'button'
  | 'card'
  | 'chart'
  | 'code-block'
  | 'dialog'
  | 'editor'
  | 'form'
  | 'image'
  | 'input'
  | 'link'
  | 'media'
  | 'menu'
  | 'navigation'
  | 'section'
  | 'table'
  | 'text'
  | 'unknown';

/** Inferred element purpose. */
export type SemanticPurpose =
  | 'authentication'
  | 'checkout'
  | 'close'
  | 'content_reading'
  | 'data_entry'
  | 'download'
  | 'edit_content'
  | 'filter'
  | 'navigation'
  | 'payment'
  | 'search'
  | 'submit_form'
  | 'unknown'
  | 'upload';

/** Semantic risk level. */
export type SemanticRisk = 'critical' | 'high' | 'low' | 'medium';

/** Relationship type in the semantic graph. */
export type SemanticRelationshipType =
  'controls' | 'describes' | 'follows' | 'inside' | 'labels' | 'owns' | 'submits' | 'updates';

/** DOM/accessibility state extracted for an element. */
export interface SemanticElementState {
  /** Element is disabled. */
  readonly disabled: boolean;
  /** Element is hidden from users. */
  readonly hidden: boolean;
  /** Element is focused. */
  readonly focused: boolean;
  /** Element is selected or checked. */
  readonly selected: boolean;
  /** Element is expanded. */
  readonly expanded?: boolean;
  /** Element is required. */
  readonly required: boolean;
  /** Value is redacted or sensitive. */
  readonly redacted: boolean;
}

/** Evidence collected by analyzers. */
export interface SemanticEvidence {
  /** Source analyzer. */
  readonly source: 'accessibility' | 'dom' | 'ocr' | 'privacy' | 'visual';
  /** Human-readable evidence. */
  readonly text: string;
  /** Evidence confidence. */
  readonly confidence: number;
}

/** Stable element reference that avoids exposing CSS selectors as the targeting contract. */
export interface SemanticElementReference {
  /** Engine-generated stable id. */
  readonly id: string;
  /** DOM path fingerprint for internal adapters. */
  readonly path: string;
  /** Text/name fingerprint. */
  readonly fingerprint: string;
}

/** Bounding rectangle. */
export interface SemanticRect {
  /** X coordinate. */
  readonly x: number;
  /** Y coordinate. */
  readonly y: number;
  /** Width. */
  readonly width: number;
  /** Height. */
  readonly height: number;
}

/** Semantic element. */
export interface SemanticElement {
  /** Stable id. */
  readonly id: string;
  /** Element role. */
  readonly role: SemanticElementRole;
  /** Accessible or visible name. */
  readonly name: string;
  /** Text content with sensitive values redacted. */
  readonly text: string;
  /** Purpose. */
  readonly purpose: SemanticPurpose;
  /** Intent summary. */
  readonly intent: string;
  /** Risk level. */
  readonly risk: SemanticRisk;
  /** Importance from 0 to 1. */
  readonly importance: number;
  /** Actionability from 0 to 1. */
  readonly actionability: number;
  /** Confidence from 0 to 1. */
  readonly confidence: number;
  /** Element state. */
  readonly state: SemanticElementState;
  /** Required dependency element ids. */
  readonly dependencies: readonly string[];
  /** Semantic reference for targeting. */
  readonly reference: SemanticElementReference;
  /** Optional layout rectangle. */
  readonly rect?: SemanticRect;
  /** Evidence. */
  readonly evidence: readonly SemanticEvidence[];
}

/** Semantic page section. */
export interface SemanticSection {
  /** Section id. */
  readonly id: string;
  /** Section label. */
  readonly label: string;
  /** Child element ids. */
  readonly elementIds: readonly string[];
  /** Confidence. */
  readonly confidence: number;
}

/** Semantic graph node. */
export interface SemanticGraphNode {
  /** Node id. */
  readonly id: string;
  /** Node kind. */
  readonly kind: SemanticNodeKind;
  /** Label. */
  readonly label: string;
  /** Payload. */
  readonly data: BrowserUnderstandingValue;
}

/** Semantic graph edge. */
export interface SemanticGraphEdge {
  /** Edge id. */
  readonly id: string;
  /** Source node id. */
  readonly from: string;
  /** Target node id. */
  readonly to: string;
  /** Relationship type. */
  readonly type: SemanticRelationshipType;
  /** Confidence. */
  readonly confidence: number;
}

/** Semantic graph. */
export interface SemanticGraph {
  /** Graph nodes. */
  readonly nodes: readonly SemanticGraphNode[];
  /** Graph edges. */
  readonly edges: readonly SemanticGraphEdge[];
}

/** Page-level security and privacy assessment. */
export interface SemanticPageRisk {
  /** Page risk level. */
  readonly risk: SemanticRisk;
  /** Reasons. */
  readonly reasons: readonly string[];
  /** Sensitive region ids. */
  readonly sensitiveElementIds: readonly string[];
}

/** Semantic page model. */
export interface SemanticPageModel {
  /** Snapshot id. */
  readonly id: string;
  /** Page URL. */
  readonly url: string;
  /** Page title. */
  readonly title: string;
  /** Language. */
  readonly language: string;
  /** Created timestamp. */
  readonly capturedAt: number;
  /** Page elements. */
  readonly elements: readonly SemanticElement[];
  /** Page sections. */
  readonly sections: readonly SemanticSection[];
  /** Semantic graph. */
  readonly graph: SemanticGraph;
  /** Page risk. */
  readonly risk: SemanticPageRisk;
  /** Snapshot fingerprint. */
  readonly fingerprint: string;
}

/** Semantic change type. */
export type SemanticChangeType = 'added' | 'removed' | 'state-changed' | 'text-changed';

/** Semantic diff entry. */
export interface SemanticDiffEntry {
  /** Change type. */
  readonly type: SemanticChangeType;
  /** Element id. */
  readonly elementId: string;
  /** Human-readable summary. */
  readonly summary: string;
}

/** Semantic snapshot diff. */
export interface SemanticDiff {
  /** Previous snapshot id. */
  readonly previousId: string;
  /** Next snapshot id. */
  readonly nextId: string;
  /** Changes. */
  readonly changes: readonly SemanticDiffEntry[];
}

/** Semantic target query. */
export interface SemanticTargetQuery {
  /** Natural language query. */
  readonly query: string;
  /** Optional role filter. */
  readonly role?: SemanticElementRole;
  /** Optional maximum risk. */
  readonly maxRisk?: SemanticRisk;
}

/** Semantic target result. */
export interface SemanticTargetResult {
  /** Matching element. */
  readonly element: SemanticElement;
  /** Match confidence. */
  readonly confidence: number;
  /** Match reason. */
  readonly reason: string;
}

/** Visual analysis adapter output. */
export interface VisualAnalysisResult {
  /** Visual evidence keyed by element fingerprint or label. */
  readonly evidence: readonly SemanticEvidence[];
}

/** OCR text region. */
export interface OcrTextRegion {
  /** Extracted text. */
  readonly text: string;
  /** Region. */
  readonly rect: SemanticRect;
  /** Language. */
  readonly language: string;
  /** Confidence. */
  readonly confidence: number;
}

/** Optional visual analyzer. */
export interface VisualAnalyzer {
  /** Analyzes a page visually. */
  analyze(document: Document): Promise<VisualAnalysisResult>;
}

/** Optional OCR analyzer. */
export interface OcrAnalyzer {
  /** Extracts OCR text regions. */
  extract(document: Document): Promise<readonly OcrTextRegion[]>;
}
