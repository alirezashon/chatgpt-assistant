import { AccessibilityAnalyzer } from './accessibility-analyzer';
import type {
  SemanticElement,
  SemanticEvidence,
  SemanticRect,
  SemanticSection,
} from './browser-understanding-types';
import { PrivacyRedactor } from './privacy-redactor';
import { SemanticClassifier } from './semantic-classifier';
import { stableHash } from './semantic-utils';

const CANDIDATE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'form',
  'nav',
  'main',
  'section',
  'article',
  'table',
  'dialog',
  'pre',
  'code',
  'img',
  'video',
  'audio',
  '[role]',
  '[contenteditable="true"]',
].join(',');

/** DOM analysis result. */
export interface DomAnalysisResult {
  /** Semantic elements. */
  readonly elements: readonly SemanticElement[];
  /** Semantic sections. */
  readonly sections: readonly SemanticSection[];
}

/** Extracts semantic candidates from DOM and Shadow DOM. */
export class DomAnalyzer {
  public constructor(
    private readonly accessibility = new AccessibilityAnalyzer(),
    private readonly classifier = new SemanticClassifier(),
    private readonly privacy = new PrivacyRedactor(),
  ) {}

  /** Analyzes a document into semantic elements and sections. */
  public analyze(document: Document): DomAnalysisResult {
    const candidates = collectCandidates(document);
    const elements = candidates.map((element, index) => this.createElement(element, index));

    return {
      elements,
      sections: buildSections(document, elements),
    };
  }

  private createElement(element: Element, index: number): SemanticElement {
    const accessibility = this.accessibility.analyze(element);
    const sensitive = this.privacy.isSensitive(element);
    const visibleText = element.textContent.trim().replaceAll(/\s+/g, ' ');
    const text = this.privacy.redactText(visibleText, sensitive);
    const inputType = element.getAttribute('type') ?? undefined;
    const classification = this.classifier.classify({
      keyboardAccessible: accessibility.keyboardAccessible,
      name: accessibility.name,
      sensitive,
      tagName: element.tagName.toLowerCase(),
      text,
      ...(inputType === undefined ? {} : { type: inputType }),
      role: accessibility.role,
    });
    const fingerprint = stableHash(
      `${element.tagName}:${accessibility.name}:${visibleText}:${index.toString()}`,
    );
    const id = `sem-${fingerprint}`;
    const evidence: SemanticEvidence[] = [
      {
        confidence: 0.9,
        source: 'accessibility',
        text: `role=${accessibility.role}; name=${accessibility.name}`,
      },
      {
        confidence: sensitive ? 0.95 : 0.7,
        source: sensitive ? 'privacy' : 'dom',
        text: sensitive ? 'Sensitive region detected.' : `tag=${element.tagName.toLowerCase()}`,
      },
    ];

    const rect = getRect(element);

    return {
      actionability: classification.actionability,
      confidence: classification.confidence,
      dependencies: getDependencies(element),
      evidence,
      id,
      importance: classification.importance,
      intent: classification.intent,
      name: this.privacy.redactText(accessibility.name, sensitive),
      purpose: classification.purpose,
      reference: {
        fingerprint,
        id,
        path: getDomPath(element),
      },
      ...(rect === undefined ? {} : { rect }),
      risk: classification.risk,
      role: accessibility.role,
      state: {
        ...accessibility.state,
        redacted: sensitive,
      },
      text,
    };
  }
}

function collectCandidates(document: Document): readonly Element[] {
  const roots: ParentNode[] = [document];
  const result: Element[] = [];

  for (const root of roots) {
    for (const element of root.querySelectorAll(CANDIDATE_SELECTOR)) {
      result.push(element);

      if (element.shadowRoot !== null) {
        roots.push(element.shadowRoot);
      }
    }
  }

  return result.filter(
    (element) => getCandidateText(element).trim().length > 0 || isInteractive(element),
  );
}

function isInteractive(element: Element): boolean {
  return (
    ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName) ||
    element.hasAttribute('role')
  );
}

function buildSections(
  document: Document,
  elements: readonly SemanticElement[],
): readonly SemanticSection[] {
  const title = document.title.trim() || 'Page';

  return [
    {
      confidence: 0.7,
      elementIds: elements.map((element) => element.id),
      id: `section-${stableHash(title)}`,
      label: title,
    },
  ];
}

function getDependencies(element: Element): readonly string[] {
  return [element.getAttribute('aria-describedby'), element.getAttribute('aria-controls')]
    .filter((value): value is string => value !== null && value.trim().length > 0)
    .flatMap((value) => value.split(/\s+/));
}

function getDomPath(element: Element): string {
  const parts: string[] = [];
  let current: Element = element;
  let parent = current.parentElement;

  while (parent !== null) {
    const currentTagName = current.tagName;
    const siblings = [...parent.children].filter((sibling) => sibling.tagName === currentTagName);
    const index = siblings.indexOf(current) + 1;
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index.toString()})`);
    current = parent;
    parent = current.parentElement;
  }

  return parts.join('>');
}

function getCandidateText(element: Element): string {
  const label = element.getAttribute('aria-label');
  return label ?? element.textContent;
}

function getRect(element: Element): SemanticRect | undefined {
  if (!(element instanceof HTMLElement)) {
    return undefined;
  }

  const rect = element.getBoundingClientRect();

  return {
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  };
}
