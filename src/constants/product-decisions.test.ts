import { describe, expect, it } from 'vitest';

import {
  BILLING_DECISION,
  FREE_PLAN_GUARANTEES,
  PREMIUM_AI_PROVIDER_DECISION,
} from '@/constants/product-decisions';
import {
  DEFAULT_ENTITLEMENT_STATE,
  canUseFeature,
  requiresSignInForFeature,
} from '@/features/entitlements';

describe('product decisions', () => {
  it('uses Stripe Billing with backend-owned entitlements for the first paid launch', () => {
    expect(BILLING_DECISION.billingOwner).toBe('stripe-billing');
    expect(BILLING_DECISION.entitlementOwner).toBe('workspace-backend');
    expect(BILLING_DECISION.rejectedOwners).toContain('chrome-web-store-payments');
  });

  it('starts premium AI with user-owned API keys before hosted usage', () => {
    expect(PREMIUM_AI_PROVIDER_DECISION.firstFlow).toBe('user-api-key-first');
    expect(PREMIUM_AI_PROVIDER_DECISION.futureFlow).toBe('hosted-api-after-billing-controls');
  });

  it('keeps core local features free without sign-in', () => {
    expect(FREE_PLAN_GUARANTEES.accountRequired).toBe(false);

    for (const featureId of FREE_PLAN_GUARANTEES.guaranteedFeatureIds) {
      expect(canUseFeature(DEFAULT_ENTITLEMENT_STATE, featureId)).toBe(true);
      expect(requiresSignInForFeature(featureId)).toBe(false);
    }
  });
});
