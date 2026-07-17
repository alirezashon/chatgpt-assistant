import { APIAuthManager } from './api-auth-manager';
import { APIObservability } from './api-observability';
import { APIRateLimiter } from './api-rate-limiter';
import { APIRouteRegistry } from './api-route-registry';
import { APISDKGenerator } from './sdk-generator';
import { APIWebhookEngine } from './webhook-engine';
import type {
  APIEvent,
  APIGatewayRequest,
  APIGatewayResponse,
  APIRoute,
  APIRouteHandler,
  APISDKLanguage,
  APIValue,
} from './api-types';
import { APIRuntimeError } from './api-types';

/** API Gateway dependencies. */
export interface APIGatewayDependencies {
  readonly auth?: APIAuthManager;
  readonly observability?: APIObservability;
  readonly rateLimiter?: APIRateLimiter;
  readonly routes?: APIRouteRegistry;
  readonly sdk?: APISDKGenerator;
  readonly webhooks?: APIWebhookEngine;
}

/** Developer API Gateway: routing, authentication, authorization, rate limiting, validation, logging, analytics, and versioning. */
export class APIGateway {
  public readonly auth: APIAuthManager;
  public readonly observability: APIObservability;
  public readonly rateLimiter: APIRateLimiter;
  public readonly routes: APIRouteRegistry;
  public readonly sdk: APISDKGenerator;
  public readonly webhooks: APIWebhookEngine;

  public constructor(dependencies: APIGatewayDependencies = {}) {
    this.auth = dependencies.auth ?? new APIAuthManager();
    this.observability = dependencies.observability ?? new APIObservability();
    this.rateLimiter = dependencies.rateLimiter ?? new APIRateLimiter();
    this.routes = dependencies.routes ?? new APIRouteRegistry();
    this.sdk = dependencies.sdk ?? new APISDKGenerator();
    this.webhooks = dependencies.webhooks ?? new APIWebhookEngine();
  }

  /** Registers a versioned public API route. */
  public registerRoute(route: APIRoute, handler: APIRouteHandler): void {
    this.routes.register(route, handler);
  }

  /** Handles an API request. */
  public async handle(request: APIGatewayRequest): Promise<APIGatewayResponse> {
    const startedAt = Date.now();
    let applicationId = 'anonymous';
    let credentialId = 'anonymous';
    let routeId = 'unmatched';

    try {
      validateRequest(request);
      detectInjection(request.body);
      const auth = this.auth.authenticate(request);
      applicationId = auth.application.id;
      credentialId = auth.credential.id;
      this.rateLimiter.consume(auth.environment);
      const record = this.routes.match(request);
      routeId = record.route.id;
      assertScopes(auth.credential.scopes, record.route.requiredScopes);
      assertVersion(record.route);
      const response = await record.handler({
        ...auth,
        request,
        route: record.route,
      });
      this.recordUsage(applicationId, credentialId, routeId, response.status, startedAt);
      return withGatewayHeaders(response, record.route.version);
    } catch (error) {
      const response = errorResponse(error);
      this.recordUsage(applicationId, credentialId, routeId, response.status, startedAt);
      return response;
    }
  }

  /** Publishes event and delivers webhooks. */
  public publishEvent(event: Omit<APIEvent, 'id' | 'timestamp'>): Promise<readonly ReturnType<APIWebhookEngine['logs']>[number][]> {
    return this.webhooks.publish({
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
  }

  /** Generates SDK client source. */
  public generateSDK(language: APISDKLanguage): string {
    return this.sdk.generate(language, this.routes.list());
  }

  private recordUsage(
    applicationId: string,
    credentialId: string,
    routeId: string,
    status: number,
    startedAt: number,
  ): void {
    this.observability.record({
      applicationId,
      credentialId,
      latencyMs: Date.now() - startedAt,
      routeId,
      status,
    });
  }
}

function validateRequest(request: APIGatewayRequest): void {
  if (!/^v[0-9]+$/.test(request.version)) {
    throw new APIRuntimeError('API_VALIDATION_FAILED', 'API version must look like v1, v2, ...');
  }

  if (!request.path.startsWith('/api/')) {
    throw new APIRuntimeError('API_VALIDATION_FAILED', 'API path must start with /api/.');
  }

  const timestamp = Number(request.headers['x-api-timestamp'] ?? request.timestamp);
  if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
    throw new APIRuntimeError('API_REPLAY_DETECTED', 'Request timestamp is outside replay window.');
  }
}

function detectInjection(value: APIValue): void {
  const serialized = JSON.stringify(value).toLowerCase();

  if (serialized.includes('__proto__') || serialized.includes('constructor.prototype')) {
    throw new APIRuntimeError('API_VALIDATION_FAILED', 'Potential injection payload rejected.');
  }
}

function assertScopes(available: readonly string[], required: readonly string[]): void {
  const missing = required.filter((scope) => !available.includes(scope));

  if (missing.length > 0) {
    throw new APIRuntimeError('API_FORBIDDEN', 'Credential is missing required scopes.', {
      missing: missing.join(','),
    });
  }
}

function assertVersion(route: APIRoute): void {
  if (route.sunsetAt !== undefined && route.sunsetAt <= Date.now()) {
    throw new APIRuntimeError('API_NOT_FOUND', 'API version has been sunset.');
  }
}

function withGatewayHeaders(response: APIGatewayResponse, version: string): APIGatewayResponse {
  return {
    ...response,
    headers: {
      ...response.headers,
      'x-api-version': version,
    },
  };
}

function errorResponse(error: unknown): APIGatewayResponse {
  if (error instanceof APIRuntimeError) {
    const status =
      error.code === 'API_AUTH_FAILED'
        ? 401
        : error.code === 'API_FORBIDDEN'
          ? 403
          : error.code === 'API_RATE_LIMITED'
            ? 429
            : error.code === 'API_NOT_FOUND'
              ? 404
              : 400;
    return {
      body: {
        code: error.code,
        message: error.message,
      },
      headers: {},
      status,
    };
  }

  return {
    body: {
      code: 'API_INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'API request failed.',
    },
    headers: {},
    status: 500,
  };
}
