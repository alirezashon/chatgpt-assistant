import type {
  EntitlementState,
  FeatureDefinition,
  FeatureId,
  FreeFeatureId,
  PlanDefinition,
  PlanId,
  PremiumFeatureId,
} from '@/features/entitlements/entitlement-types';

export const FREE_FEATURES: readonly FreeFeatureId[] = [
  'folder-management',
  'conversation-assignment',
  'basic-search',
  'favorites',
  'markdown-export',
  'local-backup',
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
  'prompt-library',
  'duplicate-detection',
  'branded-export-templates',
  'advanced-bulk-actions',
];

export const FEATURE_DEFINITIONS: Readonly<Record<FeatureId, FeatureDefinition>> = {
  'advanced-bulk-actions': {
    description: 'Move, export, tag, or clean up multiple conversations at once.',
    id: 'advanced-bulk-actions',
    name: 'Advanced bulk actions',
    tier: 'premium',
  },
  'ai-digest': {
    description: 'Get a weekly AI summary of highlights, forgotten threads, and follow-ups.',
    id: 'ai-digest',
    name: 'Weekly AI workspace digest',
    tier: 'premium',
  },
  'ai-folder-suggestions': {
    description: 'Let AI suggest folders for newly detected conversations.',
    id: 'ai-folder-suggestions',
    name: 'AI folder suggestions',
    tier: 'premium',
  },
  'ai-summaries': {
    description: 'Summarize long conversations without reading the whole thread again.',
    id: 'ai-summaries',
    name: 'AI conversation summaries',
    tier: 'premium',
  },
  'basic-search': {
    description: 'Search locally indexed conversation titles and workspace metadata.',
    id: 'basic-search',
    name: 'Basic workspace search',
    tier: 'free',
  },
  'batch-export': {
    description: 'Export multiple conversations or folders in one run.',
    id: 'batch-export',
    name: 'Batch export',
    tier: 'premium',
  },
  'branded-export-templates': {
    description: 'Create client-ready exports with reusable company branding.',
    id: 'branded-export-templates',
    name: 'Branded export templates',
    tier: 'premium',
  },
  'cloud-sync': {
    description: 'Back up and sync the workspace across Chrome profiles and devices.',
    id: 'cloud-sync',
    name: 'Cloud sync and backup',
    tier: 'premium',
  },
  'conversation-assignment': {
    description: 'Assign the current ChatGPT conversation to a local folder.',
    id: 'conversation-assignment',
    name: 'Conversation assignment',
    tier: 'free',
  },
  'duplicate-detection': {
    description: 'Find duplicate, stale, or low-value conversations before cleanup.',
    id: 'duplicate-detection',
    name: 'Duplicate and stale detection',
    tier: 'premium',
  },
  favorites: {
    description: 'Keep important conversations easy to find.',
    id: 'favorites',
    name: 'Favorites',
    tier: 'free',
  },
  'folder-management': {
    description: 'Create, rename, reorder, and delete local workspace folders.',
    id: 'folder-management',
    name: 'Folder management',
    tier: 'free',
  },
  'local-backup': {
    description: 'Export and import a local JSON backup of workspace data.',
    id: 'local-backup',
    name: 'Local backup and restore',
    tier: 'free',
  },
  'local-persistence': {
    description: 'Store workspace data locally in Chrome without an account.',
    id: 'local-persistence',
    name: 'Local-only persistence',
    tier: 'free',
  },
  'markdown-export': {
    description: 'Download selected conversation metadata as a Markdown file.',
    id: 'markdown-export',
    name: 'Markdown export',
    tier: 'free',
  },
  'pdf-export': {
    description: 'Generate polished PDF exports for handoff and archiving.',
    id: 'pdf-export',
    name: 'PDF export',
    tier: 'premium',
  },
  'prompt-library': {
    description: 'Save reusable prompts and snippets for repeated workflows.',
    id: 'prompt-library',
    name: 'Prompt library',
    tier: 'premium',
  },
  'semantic-search': {
    description: 'Search conversations by meaning instead of exact title matches.',
    id: 'semantic-search',
    name: 'Semantic search',
    tier: 'premium',
  },
};

export const PLAN_DEFINITIONS: Readonly<Record<PlanId, PlanDefinition>> = {
  'free-local': {
    description: 'Private folders, search, exports, and backup with no account required.',
    features: FREE_FEATURES,
    id: 'free-local',
    name: 'Free Local',
    requiresSignIn: false,
  },
  pro: {
    description: 'AI, advanced export, cleanup, and sync features for power users.',
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

export function getFeatureDefinition(featureId: FeatureId): FeatureDefinition {
  return FEATURE_DEFINITIONS[featureId];
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
