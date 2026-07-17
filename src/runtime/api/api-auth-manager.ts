import type {
  APIApplication,
  APICredential,
  APICredentialIssue,
  APIEnvironment,
  APIEnvironmentType,
  APIGatewayRequest,
  APIRateLimitPlan,
  APIScope,
} from './api-types';
import { APIRuntimeError } from './api-types';

/** Developer application, environment, credential lifecycle, rotation, revocation, and auth manager. */
export class APIAuthManager {
  private readonly applications = new Map<string, APIApplication>();
  private readonly credentials = new Map<string, APICredential>();
  private readonly environments = new Map<string, APIEnvironment>();

  /** Creates developer application. */
  public createApplication(input: {
    readonly allowedOrigins?: readonly string[];
    readonly description: string;
    readonly developerId: string;
    readonly name: string;
    readonly organizationId?: string;
  }): APIApplication {
    const application: APIApplication = {
      allowedOrigins: input.allowedOrigins ?? [],
      createdAt: Date.now(),
      description: input.description,
      developerId: input.developerId,
      id: crypto.randomUUID(),
      name: input.name,
      ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
    };
    this.applications.set(application.id, application);
    return application;
  }

  /** Creates application environment. */
  public createEnvironment(input: {
    readonly applicationId: string;
    readonly rateLimit?: APIRateLimitPlan;
    readonly type: APIEnvironmentType;
  }): APIEnvironment {
    this.requireApplication(input.applicationId);
    const environment: APIEnvironment = {
      applicationId: input.applicationId,
      createdAt: Date.now(),
      id: crypto.randomUUID(),
      rateLimit: input.rateLimit ?? defaultRateLimit(input.type),
      type: input.type,
    };
    this.environments.set(environment.id, environment);
    return environment;
  }

  /** Issues scoped credential. */
  public issueCredential(input: {
    readonly applicationId: string;
    readonly environmentId: string;
    readonly expiresAt?: number;
    readonly name: string;
    readonly scopes: readonly APIScope[];
  }): APICredentialIssue {
    this.requireApplication(input.applicationId);
    const environment = this.requireEnvironment(input.environmentId);

    if (environment.applicationId !== input.applicationId) {
      throw new APIRuntimeError('API_AUTH_FAILED', 'Environment does not belong to application.');
    }

    const secret = `ak_${crypto.randomUUID()}_${crypto.randomUUID()}`;
    const credential: APICredential = {
      applicationId: input.applicationId,
      createdAt: Date.now(),
      environmentId: input.environmentId,
      id: crypto.randomUUID(),
      keyPrefix: secret.slice(0, 12),
      name: input.name,
      scopes: input.scopes,
      secretHash: hashSecret(secret),
      status: 'active',
      type: 'api-key',
      ...(input.expiresAt === undefined ? {} : { expiresAt: input.expiresAt }),
    };
    this.credentials.set(credential.id, credential);
    return { credential, secret };
  }

  /** Rotates credential and returns a new secret. */
  public rotateCredential(credentialId: string): APICredentialIssue {
    const previous = this.requireCredential(credentialId);
    this.revokeCredential(credentialId);
    const issued = this.issueCredential({
      applicationId: previous.applicationId,
      environmentId: previous.environmentId,
      name: `${previous.name} rotated`,
      scopes: previous.scopes,
    });
    const next = {
      ...issued.credential,
      rotatedFromCredentialId: credentialId,
    };
    this.credentials.set(next.id, next);
    return { credential: next, secret: issued.secret };
  }

  /** Revokes credential. */
  public revokeCredential(credentialId: string): APICredential {
    const credential = this.requireCredential(credentialId);
    const next: APICredential = {
      ...credential,
      revokedAt: Date.now(),
      status: 'revoked',
    };
    this.credentials.set(credentialId, next);
    return next;
  }

  /** Authenticates request from bearer token or x-api-key. */
  public authenticate(request: APIGatewayRequest) {
    const raw = request.headers['authorization']?.replace(/^Bearer\s+/i, '') ?? request.headers['x-api-key'];

    if (raw === undefined) {
      throw new APIRuntimeError('API_AUTH_FAILED', 'Missing API credential.');
    }

    const secretHash = hashSecret(raw);
    const credential = [...this.credentials.values()].find((item) => item.secretHash === secretHash);

    const expired = (credential?.expiresAt ?? Number.POSITIVE_INFINITY) <= Date.now();

    if (credential?.status !== 'active' || expired) {
      throw new APIRuntimeError('API_AUTH_FAILED', 'Invalid or inactive API credential.');
    }

    const application = this.requireApplication(credential.applicationId);
    const environment = this.requireEnvironment(credential.environmentId);
    const origin = request.headers['origin'];

    if (application.allowedOrigins.length > 0 && !application.allowedOrigins.includes(origin ?? '')) {
      throw new APIRuntimeError('API_FORBIDDEN', 'Origin is not allowed for this application.');
    }

    return { application, credential, environment };
  }

  /** Reads app. */
  public requireApplication(applicationId: string): APIApplication {
    const application = this.applications.get(applicationId);

    if (application === undefined) {
      throw new APIRuntimeError('API_NOT_FOUND', `Application not found: ${applicationId}`);
    }

    return application;
  }

  /** Reads environment. */
  public requireEnvironment(environmentId: string): APIEnvironment {
    const environment = this.environments.get(environmentId);

    if (environment === undefined) {
      throw new APIRuntimeError('API_NOT_FOUND', `Environment not found: ${environmentId}`);
    }

    return environment;
  }

  private requireCredential(credentialId: string): APICredential {
    const credential = this.credentials.get(credentialId);

    if (credential === undefined) {
      throw new APIRuntimeError('API_NOT_FOUND', `Credential not found: ${credentialId}`);
    }

    return credential;
  }
}

function defaultRateLimit(type: APIEnvironmentType): APIRateLimitPlan {
  return type === 'production'
    ? { burst: 50, capacity: 1_000, priority: 'normal', refillPerMinute: 1_000 }
    : { burst: 10, capacity: 100, priority: 'normal', refillPerMinute: 100 };
}

function hashSecret(secret: string): string {
  let hash = 2_166_136_261;

  for (const character of secret) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(16);
}
