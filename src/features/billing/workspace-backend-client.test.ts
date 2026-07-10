import { describe, expect, it } from 'vitest';

import {
  WorkspaceBackendApiClient,
  createSignedInStateFromSubscription,
  normalizeSecureBaseUrl,
} from '@/features/billing/workspace-backend-client';
import { createSignedInEntitlementState } from '@/features/entitlements';

describe('workspace backend client', () => {
  it('requires an HTTPS backend URL', () => {
    expect(() => normalizeSecureBaseUrl('http://api.example.com')).toThrow(
      'Workspace backend URL must use HTTPS.',
    );
    expect(normalizeSecureBaseUrl('https://api.example.com/v1').toString()).toBe(
      'https://api.example.com/v1/',
    );
  });

  it('looks up subscription status with a typed secure response', async () => {
    const requests: string[] = [];
    const client = new WorkspaceBackendApiClient({
      baseUrl: 'https://api.example.com/v1',
      fetchImpl: (input) => {
        requests.push(getRequestUrl(input));

        return Promise.resolve(
          new Response(
            JSON.stringify({
              billingPortalUrl: 'https://billing.example.com/session',
              checkedAt: '2026-07-10T10:00:00.000Z',
              planId: 'pro',
              status: 'active',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
              },
              status: 200,
            },
          ),
        );
      },
    });

    await expect(client.getSubscriptionStatus('acct_123')).resolves.toEqual({
      billingPortalUrl: 'https://billing.example.com/session',
      checkedAt: '2026-07-10T10:00:00.000Z',
      planId: 'pro',
      status: 'active',
    });
    expect(requests).toEqual(['https://api.example.com/v1/accounts/acct_123/subscription']);
  });

  it('rejects insecure backend-returned links', async () => {
    const client = new WorkspaceBackendApiClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: () => {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              loginUrl: 'http://billing.example.com/login',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
              },
              status: 200,
            },
          ),
        );
      },
    });

    await expect(client.createLoginSession()).rejects.toThrow(
      'Workspace backend returned an insecure login URL.',
    );
  });

  it('applies subscription lookup results to signed-in entitlement state', () => {
    const state = createSignedInEntitlementState({
      accountEmail: 'pro@example.com',
      accountId: 'acct_123',
    });

    expect(
      createSignedInStateFromSubscription(state, {
        billingPortalUrl: 'https://billing.example.com/session',
        checkedAt: '2026-07-10T10:00:00.000Z',
        planId: 'pro',
        status: 'active',
      }),
    ).toMatchObject({
      billingPortalUrl: 'https://billing.example.com/session',
      planId: 'pro',
      subscriptionCheckedAt: '2026-07-10T10:00:00.000Z',
      subscriptionStatus: 'active',
    });
  });
});

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return input.url;
}
