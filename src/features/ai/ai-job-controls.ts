import type { AIJob } from '@/features/ai/ai-types';

export interface AIRateLimitState {
  readonly limitedUntil?: string;
  readonly remainingRequests?: number;
}

export interface AIJobControlState {
  readonly canCancel: boolean;
  readonly canRetry: boolean;
  readonly isRateLimited: boolean;
  readonly primaryAction: 'cancel' | 'retry' | 'wait' | null;
  readonly rateLimitMessage: string | null;
}

export function createAIJobControlState(
  job: AIJob,
  rateLimit: AIRateLimitState = {},
): AIJobControlState {
  const isRateLimited =
    typeof rateLimit.remainingRequests === 'number' && rateLimit.remainingRequests <= 0;
  const canCancel =
    job.status === 'queued' || job.status === 'retrying' || job.status === 'running';
  const canRetry = job.status === 'failed' && job.attempts <= job.maxRetries;

  return {
    canCancel,
    canRetry,
    isRateLimited,
    primaryAction: isRateLimited ? 'wait' : canCancel ? 'cancel' : canRetry ? 'retry' : null,
    rateLimitMessage: createRateLimitMessage(rateLimit, isRateLimited),
  };
}

function createRateLimitMessage(
  rateLimit: AIRateLimitState,
  isRateLimited: boolean,
): string | null {
  if (!isRateLimited) {
    return null;
  }

  if (rateLimit.limitedUntil === undefined) {
    return 'AI provider rate limit reached.';
  }

  return `AI provider rate limit reached until ${rateLimit.limitedUntil}.`;
}
