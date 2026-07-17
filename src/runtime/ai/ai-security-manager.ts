import { AIError } from './ai-errors';
import type { AIModelRouteDecision, AIRequest } from './ai-types';

/** Enforces provider privacy and sensitive-context safety policies. */
export class AISecurityManager {
  /** Throws when request context is not allowed to leave the current trust boundary. */
  public assertRequestAllowed(request: AIRequest, route: AIModelRouteDecision): void {
    const hasRestrictedContext = request.context.some(
      (chunk) => chunk.sensitivity === 'restricted',
    );

    if (hasRestrictedContext && !route.provider.metadata.local) {
      throw new AIError(
        'AI_PRIVACY_VIOLATION',
        'Restricted context cannot be sent to a remote AI provider.',
      );
    }

    if (request.privacyMode === 'maximum-privacy' && !route.provider.metadata.local) {
      throw new AIError(
        'AI_PRIVACY_VIOLATION',
        'Maximum privacy mode only allows local AI providers.',
      );
    }
  }
}
