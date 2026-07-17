import type {
  SemanticElementRole,
  SemanticPurpose,
  SemanticRisk,
} from './browser-understanding-types';
import { normalizeText } from './semantic-utils';

/** Semantic element classification input. */
export interface SemanticClassificationInput {
  /** Role. */
  readonly role: SemanticElementRole;
  /** Accessible name. */
  readonly name: string;
  /** Text. */
  readonly text: string;
  /** Element tag. */
  readonly tagName: string;
  /** Element type. */
  readonly type?: string;
  /** Sensitive flag. */
  readonly sensitive: boolean;
  /** Keyboard accessible. */
  readonly keyboardAccessible: boolean;
}

/** Semantic classification output. */
export interface SemanticClassification {
  /** Purpose. */
  readonly purpose: SemanticPurpose;
  /** Intent. */
  readonly intent: string;
  /** Risk. */
  readonly risk: SemanticRisk;
  /** Importance. */
  readonly importance: number;
  /** Actionability. */
  readonly actionability: number;
  /** Confidence. */
  readonly confidence: number;
}

/** Classifies elements into purpose, intent, risk, importance, and actionability. */
export class SemanticClassifier {
  /** Classifies an element. */
  public classify(input: SemanticClassificationInput): SemanticClassification {
    const joined = normalizeText(`${input.name} ${input.text} ${input.type ?? ''}`);
    const purpose = inferPurpose(joined, input);
    const actionability = getActionability(input.role, input.keyboardAccessible);
    const risk = inferRisk(joined, input, purpose);

    return {
      actionability,
      confidence: getConfidence(input, purpose),
      importance: getImportance(input.role, purpose, risk),
      intent: getIntent(purpose, input.role),
      purpose,
      risk,
    };
  }
}

function inferPurpose(text: string, input: SemanticClassificationInput): SemanticPurpose {
  if (text.includes('login') || text.includes('sign in') || text.includes('password')) {
    return 'authentication';
  }

  if (text.includes('checkout') || text.includes('cart')) {
    return 'checkout';
  }

  if (text.includes('pay') || text.includes('card') || text.includes('billing')) {
    return 'payment';
  }

  if (text.includes('search') || input.type === 'search') {
    return 'search';
  }

  if (text.includes('submit') || text.includes('save') || text.includes('continue')) {
    return 'submit_form';
  }

  if (text.includes('download')) {
    return 'download';
  }

  if (text.includes('upload') || input.type === 'file') {
    return 'upload';
  }

  if (text.includes('close') || text.includes('dismiss')) {
    return 'close';
  }

  if (input.role === 'input' || input.role === 'editor' || input.role === 'form') {
    return 'data_entry';
  }

  if (input.role === 'link' || input.role === 'navigation') {
    return 'navigation';
  }

  if (input.role === 'code-block' || input.role === 'text') {
    return 'content_reading';
  }

  return 'unknown';
}

function inferRisk(
  text: string,
  input: SemanticClassificationInput,
  purpose: SemanticPurpose,
): SemanticRisk {
  if (input.sensitive || purpose === 'payment') {
    return 'high';
  }

  if (text.includes('delete') || text.includes('purchase') || text.includes('send')) {
    return 'critical';
  }

  if (purpose === 'checkout' || purpose === 'authentication' || purpose === 'submit_form') {
    return 'medium';
  }

  return 'low';
}

function getActionability(role: SemanticElementRole, keyboardAccessible: boolean): number {
  if (['button', 'input', 'link', 'menu'].includes(role)) {
    return keyboardAccessible ? 1 : 0.7;
  }

  if (role === 'form' || role === 'dialog') {
    return 0.55;
  }

  return 0.1;
}

function getImportance(
  role: SemanticElementRole,
  purpose: SemanticPurpose,
  risk: SemanticRisk,
): number {
  if (risk === 'critical' || risk === 'high') {
    return 0.95;
  }

  if (purpose !== 'unknown') {
    return 0.8;
  }

  if (['button', 'input', 'link', 'dialog'].includes(role)) {
    return 0.7;
  }

  return 0.35;
}

function getConfidence(input: SemanticClassificationInput, purpose: SemanticPurpose): number {
  let confidence = purpose === 'unknown' ? 0.45 : 0.75;

  if (input.name.length > 0) {
    confidence += 0.15;
  }

  if (input.role !== 'unknown') {
    confidence += 0.1;
  }

  return Math.min(0.99, confidence);
}

function getIntent(purpose: SemanticPurpose, role: SemanticElementRole): string {
  if (purpose !== 'unknown') {
    return `Element supports ${purpose.replaceAll('_', ' ')}.`;
  }

  return `Element appears to be ${role}.`;
}
