/** Stable Developer API Gateway version. */
export const API_GATEWAY_VERSION = '1.0.0';

/** JSON-like API value. */
export type APIValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: APIValue }
  | readonly APIValue[];

/** API protocol. */
export type APIProtocol = 'event' | 'graphql' | 'realtime' | 'rest' | 'sdk' | 'webhook';

/** HTTP method. */
export type APIMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

/** Public API domain. */
export type APIDomain = 'agent' | 'ai' | 'enterprise' | 'knowledge' | 'memory' | 'plugin' | 'workflow';

/** API scope. */
export type APIScope =
  | 'agent.execute'
  | 'agent.read'
  | 'ai.infer'
  | 'ai.tool.execute'
  | 'enterprise.manage'
  | 'knowledge.index'
  | 'knowledge.search'
  | 'memory.read'
  | 'memory.write'
  | 'plugin.install'
  | 'plugin.read'
  | 'workflow.create'
  | 'workflow.execute'
  | 'workflow.read';

/** Auth type. */
export type APIAuthType = 'api-key' | 'jwt' | 'oauth2' | 'saml' | 'service-account';

/** Environment. */
export type APIEnvironmentType = 'development' | 'production' | 'staging';

/** Credential status. */
export type APICredentialStatus = 'active' | 'expired' | 'revoked';

/** Developer application. */
export interface APIApplication {
  readonly id: string;
  readonly developerId: string;
  readonly organizationId?: string;
  readonly name: string;
  readonly description: string;
  readonly allowedOrigins: readonly string[];
  readonly createdAt: number;
}

/** Application environment. */
export interface APIEnvironment {
  readonly id: string;
  readonly applicationId: string;
  readonly type: APIEnvironmentType;
  readonly rateLimit: APIRateLimitPlan;
  readonly createdAt: number;
}

/** Credential. */
export interface APICredential {
  readonly id: string;
  readonly applicationId: string;
  readonly environmentId: string;
  readonly type: APIAuthType;
  readonly name: string;
  readonly secretHash: string;
  readonly keyPrefix: string;
  readonly scopes: readonly APIScope[];
  readonly status: APICredentialStatus;
  readonly createdAt: number;
  readonly expiresAt?: number;
  readonly revokedAt?: number;
  readonly rotatedFromCredentialId?: string;
}

/** Credential creation result with one-time secret. */
export interface APICredentialIssue {
  readonly credential: APICredential;
  readonly secret: string;
}

/** Rate limit plan. */
export interface APIRateLimitPlan {
  readonly capacity: number;
  readonly refillPerMinute: number;
  readonly burst: number;
  readonly priority: 'enterprise' | 'normal' | 'partner';
}

/** API route. */
export interface APIRoute {
  readonly id: string;
  readonly version: string;
  readonly protocol: APIProtocol;
  readonly method: APIMethod;
  readonly path: string;
  readonly domain: APIDomain;
  readonly requiredScopes: readonly APIScope[];
  readonly deprecatedAt?: number;
  readonly sunsetAt?: number;
}

/** API request. */
export interface APIGatewayRequest {
  readonly id: string;
  readonly protocol: APIProtocol;
  readonly method: APIMethod;
  readonly path: string;
  readonly version: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly body: APIValue;
  readonly timestamp: number;
  readonly ip?: string;
}

/** Authenticated context. */
export interface APIAuthContext {
  readonly application: APIApplication;
  readonly credential: APICredential;
  readonly environment: APIEnvironment;
}

/** Handler context. */
export interface APIHandlerContext extends APIAuthContext {
  readonly request: APIGatewayRequest;
  readonly route: APIRoute;
}

/** API response. */
export interface APIGatewayResponse {
  readonly status: number;
  readonly body: APIValue;
  readonly headers: Readonly<Record<string, string>>;
}

/** API route handler. */
export type APIRouteHandler = (context: APIHandlerContext) => Promise<APIGatewayResponse> | APIGatewayResponse;

/** Webhook event type. */
export type APIEventType =
  | 'agent.completed'
  | 'knowledge.updated'
  | 'security.alert'
  | 'workflow.completed'
  | 'workflow.failed';

/** Webhook endpoint. */
export interface APIWebhookEndpoint {
  readonly id: string;
  readonly applicationId: string;
  readonly environmentId: string;
  readonly url: string;
  readonly events: readonly APIEventType[];
  readonly secret: string;
  readonly active: boolean;
  readonly createdAt: number;
}

/** Platform event. */
export interface APIEvent {
  readonly id: string;
  readonly type: APIEventType;
  readonly payload: APIValue;
  readonly organizationId?: string;
  readonly timestamp: number;
}

/** Webhook delivery. */
export interface APIWebhookDelivery {
  readonly id: string;
  readonly endpointId: string;
  readonly eventId: string;
  readonly attempt: number;
  readonly status: 'failed' | 'pending' | 'succeeded';
  readonly signature: string;
  readonly responseStatus?: number;
  readonly error?: string;
  readonly timestamp: number;
}

/** Delivery adapter. */
export interface APIWebhookDeliveryAdapter {
  deliver(endpoint: APIWebhookEndpoint, event: APIEvent, signature: string): Promise<{ readonly status: number }>;
}

/** Usage record. */
export interface APIUsageRecord {
  readonly id: string;
  readonly applicationId: string;
  readonly credentialId: string;
  readonly routeId: string;
  readonly status: number;
  readonly latencyMs: number;
  readonly timestamp: number;
}

/** SDK language. */
export type APISDKLanguage = 'csharp' | 'go' | 'java' | 'python' | 'typescript';

/** API runtime error. */
export type APIRuntimeErrorCode =
  | 'API_AUTH_FAILED'
  | 'API_FORBIDDEN'
  | 'API_NOT_FOUND'
  | 'API_RATE_LIMITED'
  | 'API_REPLAY_DETECTED'
  | 'API_VALIDATION_FAILED';

/** Structured API error. */
export class APIRuntimeError extends Error {
  readonly code: APIRuntimeErrorCode;
  readonly details: Readonly<Record<string, APIValue>> | undefined;

  public constructor(code: APIRuntimeErrorCode, message: string, details?: Readonly<Record<string, APIValue>>) {
    super(message);
    this.name = 'APIRuntimeError';
    this.code = code;
    this.details = details;
  }
}
