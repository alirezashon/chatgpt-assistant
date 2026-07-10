import { WORKSPACE_API_BASE_URL } from '@/constants/app';
import type { EntitlementState, PlanId, SubscriptionStatus } from '@/features/entitlements';

export interface LoginSession {
  readonly loginUrl: string;
}

export interface BillingPortalSession {
  readonly url: string;
}

export interface BackendSubscriptionStatus {
  readonly billingPortalUrl: string | null;
  readonly checkedAt: string;
  readonly planId: PlanId;
  readonly status: SubscriptionStatus;
}

export interface WorkspaceBackendClient {
  createBillingPortalSession(accountId: string): Promise<BillingPortalSession>;
  createLoginSession(): Promise<LoginSession>;
  getSubscriptionStatus(accountId: string): Promise<BackendSubscriptionStatus>;
  logout(accountId: string): Promise<void>;
}

type BackendFetch = typeof fetch;

interface WorkspaceBackendClientOptions {
  readonly baseUrl: string;
  readonly fetchImpl?: BackendFetch;
}

export class WorkspaceBackendApiClient implements WorkspaceBackendClient {
  private readonly baseUrl: URL;
  private readonly fetchImpl: BackendFetch;

  public constructor(options: WorkspaceBackendClientOptions) {
    this.baseUrl = normalizeSecureBaseUrl(options.baseUrl);
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  public async createLoginSession(): Promise<LoginSession> {
    const response = await this.request('/auth/login', {
      method: 'POST',
    });

    return parseLoginSession(response);
  }

  public async createBillingPortalSession(accountId: string): Promise<BillingPortalSession> {
    const response = await this.request(
      `/accounts/${encodeURIComponent(accountId)}/billing-portal`,
      {
        method: 'POST',
      },
    );

    return parseBillingPortalSession(response);
  }

  public async getSubscriptionStatus(accountId: string): Promise<BackendSubscriptionStatus> {
    const response = await this.request(`/accounts/${encodeURIComponent(accountId)}/subscription`, {
      method: 'GET',
    });

    return parseSubscriptionStatus(response);
  }

  public async logout(accountId: string): Promise<void> {
    await this.request(`/accounts/${encodeURIComponent(accountId)}/logout`, {
      method: 'POST',
    });
  }

  private async request(pathname: string, init: RequestInit): Promise<unknown> {
    const url = new URL(pathname.replace(/^\//, ''), this.baseUrl);
    const headers = new Headers(init.headers);

    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');

    const response = await this.fetchImpl(url, {
      ...init,
      credentials: 'omit',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Workspace backend request failed with HTTP ${String(response.status)}.`);
    }

    if (response.status === 204) {
      return {};
    }

    return (await response.json()) as unknown;
  }
}

export function createWorkspaceBackendClientFromEnv(): WorkspaceBackendClient | null {
  if (WORKSPACE_API_BASE_URL.trim().length === 0) {
    return null;
  }

  return new WorkspaceBackendApiClient({
    baseUrl: WORKSPACE_API_BASE_URL,
  });
}

export function createSignedInStateFromSubscription(
  state: EntitlementState,
  subscription: BackendSubscriptionStatus,
): EntitlementState {
  return {
    ...state,
    billingPortalUrl: subscription.billingPortalUrl,
    planId: subscription.planId,
    subscriptionCheckedAt: subscription.checkedAt,
    subscriptionStatus: subscription.status,
  };
}

export function normalizeSecureBaseUrl(value: string): URL {
  const url = new URL(value);

  if (url.protocol !== 'https:') {
    throw new Error('Workspace backend URL must use HTTPS.');
  }

  url.pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;

  return url;
}

function parseLoginSession(value: unknown): LoginSession {
  if (!isRecord(value) || typeof value['loginUrl'] !== 'string') {
    throw new Error('Workspace backend returned an invalid login session.');
  }

  assertHttpsUrl(value['loginUrl'], 'login URL');

  return {
    loginUrl: value['loginUrl'],
  };
}

function parseBillingPortalSession(value: unknown): BillingPortalSession {
  if (!isRecord(value) || typeof value['url'] !== 'string') {
    throw new Error('Workspace backend returned an invalid billing portal session.');
  }

  assertHttpsUrl(value['url'], 'billing portal URL');

  return {
    url: value['url'],
  };
}

function parseSubscriptionStatus(value: unknown): BackendSubscriptionStatus {
  if (!isRecord(value)) {
    throw new Error('Workspace backend returned an invalid subscription status.');
  }

  const planId = parsePlanId(value['planId']);
  const status = parseSubscriptionStatusValue(value['status']);
  const billingPortalUrl =
    typeof value['billingPortalUrl'] === 'string' ? value['billingPortalUrl'] : null;

  if (billingPortalUrl !== null) {
    assertHttpsUrl(billingPortalUrl, 'billing portal URL');
  }

  return {
    billingPortalUrl,
    checkedAt:
      typeof value['checkedAt'] === 'string' ? value['checkedAt'] : new Date().toISOString(),
    planId,
    status,
  };
}

function parsePlanId(value: unknown): PlanId {
  if (value === 'free-local' || value === 'pro') {
    return value;
  }

  throw new Error('Workspace backend returned an unknown plan.');
}

function parseSubscriptionStatusValue(value: unknown): SubscriptionStatus {
  if (
    value === 'active' ||
    value === 'canceled' ||
    value === 'expired' ||
    value === 'free' ||
    value === 'past-due' ||
    value === 'trialing' ||
    value === 'unknown'
  ) {
    return value;
  }

  throw new Error('Workspace backend returned an unknown subscription status.');
}

function assertHttpsUrl(value: string, label: string): void {
  if (new URL(value).protocol !== 'https:') {
    throw new Error(`Workspace backend returned an insecure ${label}.`);
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
