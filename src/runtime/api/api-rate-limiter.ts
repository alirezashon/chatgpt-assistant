import type { APIEnvironment } from './api-types';
import { APIRuntimeError } from './api-types';

interface Bucket {
  readonly capacity: number;
  readonly refillPerMinute: number;
  readonly burst: number;
  tokens: number;
  updatedAt: number;
}

/** Token-bucket rate limiter for application and enterprise API usage. */
export class APIRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  /** Consumes one request token. */
  public consume(environment: APIEnvironment): void {
    const bucket = this.getBucket(environment);
    refill(bucket);

    if (bucket.tokens < 1) {
      throw new APIRuntimeError('API_RATE_LIMITED', 'API rate limit exceeded.', {
        environmentId: environment.id,
      });
    }

    bucket.tokens -= 1;
  }

  private getBucket(environment: APIEnvironment): Bucket {
    const existing = this.buckets.get(environment.id);

    if (existing !== undefined) {
      return existing;
    }

    const bucket: Bucket = {
      burst: environment.rateLimit.burst,
      capacity: environment.rateLimit.capacity,
      refillPerMinute: environment.rateLimit.refillPerMinute,
      tokens: Math.min(environment.rateLimit.capacity + environment.rateLimit.burst, environment.rateLimit.capacity),
      updatedAt: Date.now(),
    };
    this.buckets.set(environment.id, bucket);
    return bucket;
  }
}

function refill(bucket: Bucket): void {
  const elapsedMs = Date.now() - bucket.updatedAt;
  const refill = (elapsedMs / 60_000) * bucket.refillPerMinute;
  bucket.tokens = Math.min(bucket.capacity + bucket.burst, bucket.tokens + refill);
  bucket.updatedAt = Date.now();
}
