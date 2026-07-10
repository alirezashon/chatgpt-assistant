import type {
  EntitlementState,
  FeatureId,
  FreeFeatureId,
  PlanDefinition,
  PlanId,
  PremiumFeatureId,
} from '@/features/entitlements/entitlement-types';

export const FREE_FEATURES: readonly FreeFeatureId[] = [
  'folder-management',
  'basic-search',
  'favorites',
  'local-persistence',
];

export const PREMIUM_FEATURES: readonly PremiumFeatureId[] = [
  'ai-summaries',
  'ai-folder-suggestions',
  'semantic-search',
  'pdf-export',
  'batch-export',
  'cloud-sync',
  'ai-digest',
  'advanced-bulk-actions',
];

export const PLAN_DEFINITIONS: Readonly<Record<PlanId, PlanDefinition>> = {
  'free-local': {
    description: 'Private local organization with no account required.',
    features: FREE_FEATURES,
    id: 'free-local',
    name: 'Free Local',
    requiresSignIn: false,
  },
  pro: {
    description: 'AI, export, and sync features for power users.',
    features: [...FREE_FEATURES, ...PREMIUM_FEATURES],
    id: 'pro',
    name: 'Pro',
    requiresSignIn: true,
  },
};

export const DEFAULT_ENTITLEMENT_STATE: EntitlementState = {
  accountEmail: null,
  planId: 'free-local',
  signedIn: false,
};

export function getPlanDefinition(planId: PlanId): PlanDefinition {
  return PLAN_DEFINITIONS[planId];
}

export function isFeatureAvailable(state: EntitlementState, featureId: FeatureId): boolean {
  return getPlanDefinition(state.planId).features.includes(featureId);
}

export function requiresSignInForFeature(featureId: FeatureId): boolean {
  return PREMIUM_FEATURES.includes(featureId as PremiumFeatureId);
}

export function canUseFeature(state: EntitlementState, featureId: FeatureId): boolean {
  if (!isFeatureAvailable(state, featureId)) {
    return false;
  }

  return !requiresSignInForFeature(featureId) || state.signedIn;
}
