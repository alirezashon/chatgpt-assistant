import type {
  AccountIdentity,
  EntitlementState,
  FeatureDefinition,
  FeatureId,
  FreeFeatureId,
  PlanDefinition,
  PlanId,
  PremiumFeatureId,
  SubscriptionStatus,
} from '@/features/entitlements/entitlement-types';

export const LICENSE_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const OFFLINE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export type LicenseAccessStatus =
  'available' | 'expired' | 'grace-period' | 'refresh-required' | 'signed-out';

export interface LicenseAccessState {
  readonly canUsePremium: boolean;
  readonly refreshDue: boolean;
  readonly status: LicenseAccessStatus;
}

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
  'ai-cache-audit-reports': {
    description: 'Review saved AI cache entries, token savings, stale results, and cleanup needs.',
    id: 'ai-cache-audit-reports',
    name: 'AI cache audit reports',
    tier: 'premium',
  },
  'ai-credit-packs': {
    description: 'Buy occasional premium AI usage without changing the base subscription.',
    id: 'ai-credit-packs',
    name: 'Usage-based AI credit packs',
    tier: 'premium',
  },
  'ai-folder-suggestions': {
    description: 'Let AI suggest folders for newly detected conversations.',
    id: 'ai-folder-suggestions',
    name: 'AI folder suggestions',
    tier: 'premium',
  },
  'ai-job-center': {
    description: 'Retry, monitor, cancel, and diagnose premium AI jobs from one place.',
    id: 'ai-job-center',
    name: 'Pro AI job center',
    tier: 'premium',
  },
  'ai-summaries': {
    description: 'Summarize long conversations without reading the whole thread again.',
    id: 'ai-summaries',
    name: 'AI conversation summaries',
    tier: 'premium',
  },
  'auto-tags': {
    description: 'Suggest and apply tags from conversation content and workspace patterns.',
    id: 'auto-tags',
    name: 'Tags and auto-tags',
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
  'billing-seat-attribution': {
    description: 'Track Pro seats and attribute subscription cost by client or project.',
    id: 'billing-seat-attribution',
    name: 'Pro billing seats and cost attribution',
    tier: 'premium',
  },
  'branded-export-templates': {
    description: 'Create client-ready exports with reusable company branding.',
    id: 'branded-export-templates',
    name: 'Branded export templates',
    tier: 'premium',
  },
  'client-handoff-reports': {
    description: 'Generate client-ready project handoff reports from selected conversations.',
    id: 'client-handoff-reports',
    name: 'Client handoff reports',
    tier: 'premium',
  },
  'cloud-sync': {
    description: 'Back up and sync the workspace across Chrome profiles and devices.',
    id: 'cloud-sync',
    name: 'Cloud sync and backup',
    tier: 'premium',
  },
  'compliance-audit-exports': {
    description: 'Export privacy and compliance audit trails for professional workspaces.',
    id: 'compliance-audit-exports',
    name: 'Privacy and compliance audit exports',
    tier: 'premium',
  },
  'conflict-timeline-restore': {
    description: 'Review cross-tab conflicts over time and restore a previous workspace state.',
    id: 'conflict-timeline-restore',
    name: 'Conflict timeline and restore',
    tier: 'premium',
  },
  'conversation-assignment': {
    description: 'Assign the current ChatGPT conversation to a local folder.',
    id: 'conversation-assignment',
    name: 'Conversation assignment',
    tier: 'free',
  },
  'conversation-detection-diagnostics': {
    description: 'Create shareable diagnostics when ChatGPT UI changes affect detection.',
    id: 'conversation-detection-diagnostics',
    name: 'Conversation detection diagnostics',
    tier: 'premium',
  },
  'duplicate-detection': {
    description: 'Find duplicate, stale, or low-value conversations before cleanup.',
    id: 'duplicate-detection',
    name: 'Duplicate and stale detection',
    tier: 'premium',
  },
  'feature-readiness-matrix': {
    description: 'See which paid tools are ready, configured, blocked, or missing setup.',
    id: 'feature-readiness-matrix',
    name: 'Pro feature readiness matrix',
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
  'managed-provider-key-vault': {
    description: 'Use a managed vault for provider keys instead of pasting them every session.',
    id: 'managed-provider-key-vault',
    name: 'Managed provider-key vault',
    tier: 'premium',
  },
  'multi-provider-workspaces': {
    description: 'Organize work across ChatGPT, Claude, Gemini, Grok, Perplexity, and local LLMs.',
    id: 'multi-provider-workspaces',
    name: 'Multi-provider workspaces',
    tier: 'premium',
  },
  'pdf-export': {
    description: 'Generate polished PDF exports for handoff and archiving.',
    id: 'pdf-export',
    name: 'PDF export',
    tier: 'premium',
  },
  'premium-workspace-templates': {
    description: 'Start from guided templates for writers, traders, developers, and agencies.',
    id: 'premium-workspace-templates',
    name: 'Premium workspace templates',
    tier: 'premium',
  },
  'prompt-library': {
    description: 'Save reusable prompts and snippets for repeated workflows.',
    id: 'prompt-library',
    name: 'Prompt library',
    tier: 'premium',
  },
  'priority-compatibility-alerts': {
    description: 'Get priority alerts when ChatGPT UI changes affect Pro workflows.',
    id: 'priority-compatibility-alerts',
    name: 'Priority compatibility alerts',
    tier: 'premium',
  },
  'priority-support-diagnostics': {
    description: 'Prepare diagnostic bundles for faster priority support.',
    id: 'priority-support-diagnostics',
    name: 'Priority support diagnostics',
    tier: 'premium',
  },
  'pro-diagnostic-health-reports': {
    description: 'Generate health reports with suggested fixes for Pro workspaces.',
    id: 'pro-diagnostic-health-reports',
    name: 'Pro diagnostic health reports',
    tier: 'premium',
  },
  'pro-release-channels': {
    description: 'Access experimental Pro tools before they reach the stable release channel.',
    id: 'pro-release-channels',
    name: 'Pro release channels',
    tier: 'premium',
  },
  'release-readiness-audits': {
    description: 'Run automated release readiness audits for team workspaces.',
    id: 'release-readiness-audits',
    name: 'Release readiness audits',
    tier: 'premium',
  },
  'saved-export-profiles': {
    description: 'Save repeat export profiles with tags, folders, formats, and branding.',
    id: 'saved-export-profiles',
    name: 'Saved export profiles',
    tier: 'premium',
  },
  'scheduled-encrypted-backups': {
    description: 'Schedule encrypted backups to cloud storage for Pro workspaces.',
    id: 'scheduled-encrypted-backups',
    name: 'Scheduled encrypted backups',
    tier: 'premium',
  },
  'semantic-search': {
    description: 'Search conversations by meaning instead of exact title matches.',
    id: 'semantic-search',
    name: 'Semantic search',
    tier: 'premium',
  },
  'smart-cleanup': {
    description: 'Get cleanup suggestions for stale, duplicate, empty, or forgotten threads.',
    id: 'smart-cleanup',
    name: 'Smart cleanup suggestions',
    tier: 'premium',
  },
  'team-workspaces': {
    description: 'Create shared team or agency workspaces after the solo product is stable.',
    id: 'team-workspaces',
    name: 'Team and agency workspaces',
    tier: 'premium',
  },
  'versioned-restore-points': {
    description: 'Create versioned restore points for paid backup and rollback.',
    id: 'versioned-restore-points',
    name: 'Versioned restore points',
    tier: 'premium',
  },
  'workspace-health-checks': {
    description: 'Warn about broken sync, stale exports, missing backups, or setup gaps.',
    id: 'workspace-health-checks',
    name: 'Workspace health checks',
    tier: 'premium',
  },
  'workspace-backup-restore': {
    description: 'Restore versioned workspace backups across devices and Chrome profiles.',
    id: 'workspace-backup-restore',
    name: 'Workspace backup and restore',
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
  accountId: null,
  billingPortalUrl: null,
  planId: 'free-local',
  signedIn: false,
  subscriptionCheckedAt: null,
  subscriptionStatus: 'free',
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

  return !requiresSignInForFeature(featureId) || getLicenseAccessState(state).canUsePremium;
}

export function createSignedOutEntitlementState(): EntitlementState {
  return DEFAULT_ENTITLEMENT_STATE;
}

export function createSignedInEntitlementState(input: {
  readonly accountEmail: string;
  readonly accountId: string;
  readonly billingPortalUrl?: string | null;
  readonly planId?: PlanId;
  readonly subscriptionCheckedAt?: string | null;
  readonly subscriptionStatus?: SubscriptionStatus;
}): EntitlementState {
  return {
    accountEmail: input.accountEmail,
    accountId: input.accountId,
    billingPortalUrl: input.billingPortalUrl ?? null,
    planId: input.planId ?? 'pro',
    signedIn: true,
    subscriptionCheckedAt: input.subscriptionCheckedAt ?? null,
    subscriptionStatus: input.subscriptionStatus ?? 'active',
  };
}

export function applySubscriptionStatus(
  state: EntitlementState,
  input: {
    readonly billingPortalUrl?: string | null;
    readonly checkedAt: string;
    readonly planId: PlanId;
    readonly status: SubscriptionStatus;
  },
): EntitlementState {
  return {
    ...state,
    billingPortalUrl: input.billingPortalUrl ?? state.billingPortalUrl,
    planId: input.planId,
    subscriptionCheckedAt: input.checkedAt,
    subscriptionStatus: input.status,
  };
}

export function getLicenseAccessState(
  state: EntitlementState,
  now: Date = new Date(),
): LicenseAccessState {
  if (!state.signedIn) {
    return {
      canUsePremium: false,
      refreshDue: false,
      status: 'signed-out',
    };
  }

  const refreshDue = isLicenseRefreshDue(state, now);

  if (state.subscriptionStatus === 'active' || state.subscriptionStatus === 'trialing') {
    return {
      canUsePremium: true,
      refreshDue,
      status: refreshDue ? 'refresh-required' : 'available',
    };
  }

  if (
    state.subscriptionStatus === 'canceled' ||
    state.subscriptionStatus === 'past-due' ||
    state.subscriptionStatus === 'unknown'
  ) {
    const inGracePeriod = isWithinOfflineGracePeriod(state, now);

    return {
      canUsePremium: inGracePeriod,
      refreshDue: true,
      status: inGracePeriod ? 'grace-period' : 'expired',
    };
  }

  return {
    canUsePremium: false,
    refreshDue,
    status: 'expired',
  };
}

export function isLicenseRefreshDue(state: EntitlementState, now: Date = new Date()): boolean {
  if (!state.signedIn) {
    return false;
  }

  if (state.subscriptionCheckedAt === null) {
    return true;
  }

  return now.getTime() - Date.parse(state.subscriptionCheckedAt) > LICENSE_REFRESH_INTERVAL_MS;
}

export function isWithinOfflineGracePeriod(
  state: EntitlementState,
  now: Date = new Date(),
): boolean {
  if (!state.signedIn || state.subscriptionCheckedAt === null) {
    return false;
  }

  return now.getTime() - Date.parse(state.subscriptionCheckedAt) <= OFFLINE_GRACE_PERIOD_MS;
}

export const SECURE_TOKEN_STORAGE_POLICY = {
  forbiddenPersistedFieldNames: [
    'accessToken',
    'apiKey',
    'idToken',
    'refreshToken',
    'sessionToken',
    'token',
  ],
  storage: 'memory-only-or-backend-http-only',
  summary:
    'Provider keys and auth tokens must not be persisted in Chrome local storage or workspace backups.',
} as const;

export function assertNoPersistedSecrets(value: unknown): void {
  const secretPath = findPersistedSecretPath(value);

  if (secretPath !== null) {
    throw new Error(`Persisted secret field is not allowed: ${secretPath}.`);
  }
}

function findPersistedSecretPath(value: unknown, path = '$'): string | null {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const result = findPersistedSecretPath(item, `${path}[${index.toString()}]`);

      if (result !== null) {
        return result;
      }
    }

    return null;
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  for (const [key, item] of Object.entries(value)) {
    const itemPath = `${path}.${key}`;

    if (
      SECURE_TOKEN_STORAGE_POLICY.forbiddenPersistedFieldNames.includes(
        key as (typeof SECURE_TOKEN_STORAGE_POLICY.forbiddenPersistedFieldNames)[number],
      )
    ) {
      return itemPath;
    }

    const result = findPersistedSecretPath(item, itemPath);

    if (result !== null) {
      return result;
    }
  }

  return null;
}

export function getAccountIdentity(state: EntitlementState): AccountIdentity {
  if (!state.signedIn) {
    return {
      email: null,
      id: null,
      status: 'signed-out',
    };
  }

  return {
    email: state.accountEmail,
    id: state.accountId,
    status: 'signed-in',
  };
}
