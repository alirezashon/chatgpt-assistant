import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ENTITLEMENT_STATE,
  FREE_FEATURES,
  PREMIUM_FEATURES,
  assertNoPersistedSecrets,
  canUseFeature,
  createSignedInEntitlementState,
  createSignedOutEntitlementState,
  getAccountIdentity,
  getFeatureDefinition,
  getLicenseAccessState,
  getPlanDefinition,
  getPremiumFeatureAccessPolicy,
  getPremiumFeatureReadiness,
  isFeatureAvailable,
  requiresExternalAIConsent,
  requiresSignInForFeature,
  requiresWorkspaceCloud,
} from '@/features/entitlements';

describe('entitlements', () => {
  it('keeps the default plan local and account-free', () => {
    const freePlan = getPlanDefinition(DEFAULT_ENTITLEMENT_STATE.planId);

    expect(freePlan.id).toBe('free-local');
    expect(freePlan.requiresSignIn).toBe(false);
    expect(DEFAULT_ENTITLEMENT_STATE.accountId).toBeNull();
    expect(DEFAULT_ENTITLEMENT_STATE.signedIn).toBe(false);
  });

  it('allows free features without sign-in', () => {
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'folder-management')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'conversation-assignment')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'basic-search')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'favorites')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'local-persistence')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'markdown-export')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'local-backup')).toBe(true);
  });

  it('models account identity separately from the free local default', () => {
    expect(createSignedOutEntitlementState()).toEqual(DEFAULT_ENTITLEMENT_STATE);
    expect(getAccountIdentity(DEFAULT_ENTITLEMENT_STATE)).toEqual({
      email: null,
      id: null,
      status: 'signed-out',
    });

    const signedInState = createSignedInEntitlementState({
      accountEmail: 'pro@example.com',
      accountId: 'acct_123',
    });

    expect(signedInState).toMatchObject({
      accountEmail: 'pro@example.com',
      accountId: 'acct_123',
      planId: 'pro',
      signedIn: true,
    });
    expect(getAccountIdentity(signedInState)).toEqual({
      email: 'pro@example.com',
      id: 'acct_123',
      status: 'signed-in',
    });
  });

  it('defines the complete free plan feature set', () => {
    const freePlan = getPlanDefinition('free-local');

    expect(freePlan.features).toEqual(FREE_FEATURES);
    expect(freePlan.features).toEqual([
      'folder-management',
      'conversation-assignment',
      'basic-search',
      'favorites',
      'markdown-export',
      'local-backup',
      'local-persistence',
    ]);
    expect(
      freePlan.features.every((featureId) => getFeatureDefinition(featureId).tier === 'free'),
    ).toBe(true);
  });

  it('defines the paid plan as the free plan plus premium features', () => {
    const proPlan = getPlanDefinition('pro');

    expect(proPlan.requiresSignIn).toBe(true);
    expect(proPlan.features).toEqual([...FREE_FEATURES, ...PREMIUM_FEATURES]);
    expect(PREMIUM_FEATURES).toEqual([
      'ai-summaries',
      'ai-folder-suggestions',
      'duplicate-detection',
      'smart-cleanup',
      'semantic-search',
      'auto-tags',
      'pdf-export',
      'batch-export',
      'cloud-sync',
      'workspace-backup-restore',
      'ai-digest',
      'prompt-library',
      'branded-export-templates',
      'advanced-bulk-actions',
      'multi-provider-workspaces',
      'team-workspaces',
      'client-handoff-reports',
      'versioned-restore-points',
      'workspace-health-checks',
      'premium-workspace-templates',
      'conversation-detection-diagnostics',
      'scheduled-encrypted-backups',
      'ai-credit-packs',
      'priority-compatibility-alerts',
      'pro-release-channels',
      'compliance-audit-exports',
      'release-readiness-audits',
      'priority-support-diagnostics',
      'pro-diagnostic-health-reports',
      'billing-seat-attribution',
      'saved-export-profiles',
      'conflict-timeline-restore',
      'managed-provider-key-vault',
      'ai-job-center',
      'ai-cache-audit-reports',
      'feature-readiness-matrix',
    ]);
    expect(
      PREMIUM_FEATURES.every((featureId) => getFeatureDefinition(featureId).tier === 'premium'),
    ).toBe(true);
  });

  it('marks premium features as sign-in gated', () => {
    expect(requiresSignInForFeature('ai-summaries')).toBe(true);
    expect(isFeatureAvailable(DEFAULT_ENTITLEMENT_STATE, 'ai-summaries')).toBe(false);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'ai-summaries')).toBe(false);
  });

  it('promotes the next paid ideas into explicit Pro feature policies', () => {
    const nextPaidIdeas = PREMIUM_FEATURES.slice(0, 10);

    expect(nextPaidIdeas).toEqual([
      'ai-summaries',
      'ai-folder-suggestions',
      'duplicate-detection',
      'smart-cleanup',
      'semantic-search',
      'auto-tags',
      'pdf-export',
      'batch-export',
      'cloud-sync',
      'workspace-backup-restore',
    ]);
    expect(requiresExternalAIConsent('ai-summaries')).toBe(true);
    expect(requiresExternalAIConsent('semantic-search')).toBe(true);
    expect(requiresExternalAIConsent('pdf-export')).toBe(false);
    expect(requiresWorkspaceCloud('cloud-sync')).toBe(true);
    expect(requiresWorkspaceCloud('workspace-backup-restore')).toBe(true);
    expect(getPremiumFeatureAccessPolicy('smart-cleanup')).toEqual({
      featureId: 'smart-cleanup',
      requirements: ['account'],
    });
  });

  it('models the remaining paid ideas as Pro features with readiness policies', () => {
    const remainingPaidIdeas = PREMIUM_FEATURES.slice(10);

    expect(remainingPaidIdeas).toEqual([
      'ai-digest',
      'prompt-library',
      'branded-export-templates',
      'advanced-bulk-actions',
      'multi-provider-workspaces',
      'team-workspaces',
      'client-handoff-reports',
      'versioned-restore-points',
      'workspace-health-checks',
      'premium-workspace-templates',
      'conversation-detection-diagnostics',
      'scheduled-encrypted-backups',
      'ai-credit-packs',
      'priority-compatibility-alerts',
      'pro-release-channels',
      'compliance-audit-exports',
      'release-readiness-audits',
      'priority-support-diagnostics',
      'pro-diagnostic-health-reports',
      'billing-seat-attribution',
      'saved-export-profiles',
      'conflict-timeline-restore',
      'managed-provider-key-vault',
      'ai-job-center',
      'ai-cache-audit-reports',
      'feature-readiness-matrix',
    ]);
    expect(requiresExternalAIConsent('ai-job-center')).toBe(true);
    expect(requiresWorkspaceCloud('scheduled-encrypted-backups')).toBe(true);
    expect(getPremiumFeatureAccessPolicy('multi-provider-workspaces')).toEqual({
      featureId: 'multi-provider-workspaces',
      requirements: ['account', 'provider-key'],
    });
  });

  it('reports readiness for paid features from their required setup', () => {
    expect(
      getPremiumFeatureReadiness('semantic-search', {
        accountConnected: true,
        externalAIConsentAccepted: false,
        providerKeyConfigured: false,
        workspaceCloudConfigured: true,
      }),
    ).toEqual({
      featureId: 'semantic-search',
      missingRequirements: ['external-ai-consent', 'provider-key'],
      status: 'blocked',
    });
    expect(
      getPremiumFeatureReadiness('cloud-sync', {
        accountConnected: true,
        externalAIConsentAccepted: false,
        providerKeyConfigured: false,
        workspaceCloudConfigured: true,
      }),
    ).toEqual({
      featureId: 'cloud-sync',
      missingRequirements: [],
      status: 'ready',
    });
  });

  it('handles license refresh, offline grace, and expired paid access', () => {
    const signedInState = createSignedInEntitlementState({
      accountEmail: 'pro@example.com',
      accountId: 'acct_123',
      subscriptionCheckedAt: '2026-07-01T00:00:00.000Z',
      subscriptionStatus: 'active',
    });

    expect(getLicenseAccessState(signedInState, new Date('2026-07-01T12:00:00.000Z'))).toEqual({
      canUsePremium: true,
      refreshDue: false,
      status: 'available',
    });
    expect(getLicenseAccessState(signedInState, new Date('2026-07-03T00:00:00.000Z'))).toEqual({
      canUsePremium: true,
      refreshDue: true,
      status: 'refresh-required',
    });
    expect(
      getLicenseAccessState(
        {
          ...signedInState,
          subscriptionStatus: 'past-due',
        },
        new Date('2026-07-04T00:00:00.000Z'),
      ),
    ).toEqual({
      canUsePremium: true,
      refreshDue: true,
      status: 'grace-period',
    });
    expect(
      getLicenseAccessState(
        {
          ...signedInState,
          subscriptionStatus: 'expired',
        },
        new Date('2026-07-04T00:00:00.000Z'),
      ).canUsePremium,
    ).toBe(false);
  });

  it('blocks persisted token-like secrets', () => {
    expect(() =>
      assertNoPersistedSecrets({
        auth: {
          refreshToken: 'secret',
        },
      }),
    ).toThrow('Persisted secret field is not allowed: $.auth.refreshToken.');
    expect(() =>
      assertNoPersistedSecrets({
        accountId: 'acct_123',
        planId: 'pro',
      }),
    ).not.toThrow();
  });
});
