import type {
  SemanticElement,
  SemanticPageModel,
  SemanticTargetQuery,
  SemanticTargetResult,
} from './browser-understanding-types';
import { normalizeText, riskScore, tokenize } from './semantic-utils';

/** Resolves human-like semantic queries to page elements. */
export class SemanticTargetingEngine {
  /** Finds the best semantic targets. */
  public find(
    model: SemanticPageModel,
    query: SemanticTargetQuery,
    limit = 5,
  ): readonly SemanticTargetResult[] {
    const terms = tokenize(query.query);

    return model.elements
      .filter((element) => query.role === undefined || element.role === query.role)
      .filter(
        (element) =>
          query.maxRisk === undefined || riskScore(element.risk) <= riskScore(query.maxRisk),
      )
      .map((element) => scoreElement(element, terms, query.query))
      .filter((result) => result.confidence > 0)
      .sort(
        (left, right) =>
          right.confidence - left.confidence || right.element.importance - left.element.importance,
      )
      .slice(0, limit);
  }
}

function scoreElement(
  element: SemanticElement,
  terms: readonly string[],
  query: string,
): SemanticTargetResult {
  const haystack = normalizeText(
    `${element.name} ${element.text} ${element.role} ${element.purpose} ${element.intent}`,
  );
  const matched = terms.filter((term) => haystack.includes(term)).length;
  const semanticBoost = normalizeText(query).includes(element.purpose.replaceAll('_', ' '))
    ? 0.25
    : 0;
  const roleBoost = haystack.includes(normalizeText(query)) ? 0.3 : 0;
  const confidence = Math.min(
    0.99,
    (matched / Math.max(terms.length, 1)) * 0.55 +
      element.actionability * 0.2 +
      element.confidence * 0.15 +
      semanticBoost +
      roleBoost,
  );

  return {
    confidence,
    element,
    reason: `Matched ${matched.toString()} query term(s), purpose=${element.purpose}, role=${element.role}.`,
  };
}
