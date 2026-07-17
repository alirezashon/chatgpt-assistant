import type { AIRequest, AIResponse } from './ai-types';

/** Evaluates AI response quality with deterministic local heuristics. */
export class AIEvaluationManager {
  /** Scores response from 0 to 1. */
  public evaluate(request: AIRequest, response: AIResponse): number {
    if (response.text.trim().length === 0) {
      return 0;
    }

    const intentTerms = request.intent.toLowerCase().split(/\s+/).filter(Boolean);
    const output = response.text.toLowerCase();
    const matched = intentTerms.filter((term) => output.includes(term)).length;

    return Math.min(1, 0.65 + (matched / Math.max(intentTerms.length, 1)) * 0.35);
  }
}
