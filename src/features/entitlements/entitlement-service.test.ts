import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ENTITLEMENT_STATE,
  FREE_FEATURES,
  PREMIUM_FEATURES,
  canUseFeature,
  getFeatureDefinition,
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
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'conversation-assignment')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'basic-search')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'markdown-export')).toBe(true);
    expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, 'local-backup')).toBe(true);
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
      'semantic-search',
      'pdf-export',
      'batch-export',
      'cloud-sync',
      'ai-digest',
      'prompt-library',
      'duplicate-detection',
      'branded-export-templates',
      'advanced-bulk-actions',
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
});
