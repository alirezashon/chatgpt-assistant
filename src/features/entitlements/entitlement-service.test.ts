import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ENTITLEMENT_STATE,
  canUseFeature,
  getPlanDefinition,
  isFeatureAvailable,
  requiresSignInForFeature,
} from '@/features/entitlements';

describe('entitlements', () => {
  it('keeps the default plan local and account-free', () => {
    const freePlan = getPlanDefinition(DEFAULT_ENTITLEMENT_STATE.planId);

    expect(freePlan.id).toBe('free-local');
    expect(freePlan.requiresSignIn).toBe(false);
    expect(DEFAULT_ENTITLEMENT_STATE.signedIn).toBe(false);
  });

  it('allows free features without sign-in', () => {
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'folder-management')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'basic-search')).toBe(true);
  });

  it('marks premium features as sign-in gated', () => {
    expect(requiresSignInForFeature('ai-summaries')).toBe(true);
    expect(isFeatureAvailable(DEFAULT_ENTITLEMENT_STATE, 'ai-summaries')).toBe(false);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'ai-summaries')).toBe(false);
  });
});
