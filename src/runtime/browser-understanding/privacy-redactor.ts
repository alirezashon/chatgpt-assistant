import type {
  SemanticElement,
  SemanticPageRisk,
  SemanticRisk,
} from './browser-understanding-types';

const SENSITIVE_HINTS = [
  'password',
  'card',
  'credit',
  'cvv',
  'ssn',
  'social security',
  'bank',
  'routing',
  'health',
  'medical',
  'patient',
  'token',
  'secret',
];

/** Detects sensitive regions and redacts element text. */
export class PrivacyRedactor {
  /** Returns true when an element appears sensitive. */
  public isSensitive(element: Element): boolean {
    const joined = [
      element.getAttribute('type'),
      element.getAttribute('name'),
      element.getAttribute('autocomplete'),
      element.getAttribute('aria-label'),
      element.id,
      element.textContent,
    ]
      .filter((value): value is string => value !== null)
      .join(' ')
      .toLowerCase();

    return SENSITIVE_HINTS.some((hint) => joined.includes(hint));
  }

  /** Redacts text when sensitive. */
  public redactText(text: string, sensitive: boolean): string {
    return sensitive && text.trim().length > 0 ? '[REDACTED]' : text;
  }

  /** Creates page-level risk from semantic elements. */
  public assess(elements: readonly SemanticElement[], url: string): SemanticPageRisk {
    const sensitiveElementIds = elements
      .filter((element) => element.state.redacted)
      .map((element) => element.id);
    const urlLower = url.toLowerCase();
    const reasons: string[] = [];

    if (sensitiveElementIds.length > 0) {
      reasons.push('Sensitive form or content detected.');
    }

    if (
      urlLower.includes('bank') ||
      urlLower.includes('checkout') ||
      urlLower.includes('payment')
    ) {
      reasons.push('High-risk page URL pattern.');
    }

    return {
      reasons,
      risk: getPageRisk(elements, reasons),
      sensitiveElementIds,
    };
  }
}

function getPageRisk(
  elements: readonly SemanticElement[],
  reasons: readonly string[],
): SemanticRisk {
  if (elements.some((element) => element.risk === 'critical')) {
    return 'critical';
  }

  if (elements.some((element) => element.risk === 'high') || reasons.length > 0) {
    return 'high';
  }

  if (elements.some((element) => element.risk === 'medium')) {
    return 'medium';
  }

  return 'low';
}
