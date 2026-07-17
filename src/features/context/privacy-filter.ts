import type { ContextContentBlock, ContextPrivacy } from './context-types';

const SENSITIVE_HOST_PATTERNS = [
  /bank/iu,
  /billing/iu,
  /checkout/iu,
  /health/iu,
  /medical/iu,
  /patient/iu,
  /payroll/iu,
];

/** Filters sensitive content and records what was filtered. */
export class PrivacyFilter {
  /** Returns privacy metadata for the current page and selection. */
  public inspect(input: {
    readonly hostname: string;
    readonly selectedText: string;
    readonly content: readonly ContextContentBlock[];
    readonly documentRef?: Document;
  }): ContextPrivacy {
    const text = [input.selectedText, ...input.content.map((block) => block.text)]
      .join('\n')
      .slice(0, 8000);
    const redactions: string[] = [];
    const dataClasses: string[] = [];

    if (SENSITIVE_HOST_PATTERNS.some((pattern) => pattern.test(input.hostname))) {
      dataClasses.push('sensitive-domain');
    }

    if (/\b\d{3}-\d{2}-\d{4}\b/u.test(text)) {
      dataClasses.push('government-id');
      redactions.push('government id pattern');
    }

    if (/\b(?:\d[ -]*?){13,19}\b/u.test(text)) {
      dataClasses.push('payment-card');
      redactions.push('payment card pattern');
    }

    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu.test(text)) {
      dataClasses.push('email-address');
      redactions.push('email address');
    }

    const containsSensitiveFields =
      input.documentRef?.querySelector('input[type="password"], input[name*="token" i]') !==
      null;

    if (containsSensitiveFields) {
      dataClasses.push('credential-field');
      redactions.push('credential fields');
    }

    return {
      containsSensitiveFields,
      dataClasses,
      redactions,
      safeForAI: dataClasses.every((dataClass) => dataClass === 'email-address'),
    };
  }

  /** Redacts sensitive patterns from text before it can be sent to AI. */
  public redactText(value: string): string {
    return value
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, '[email]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/gu, '[government-id]')
      .replace(/\b(?:\d[ -]*?){13,19}\b/gu, '[payment-card]');
  }
}
