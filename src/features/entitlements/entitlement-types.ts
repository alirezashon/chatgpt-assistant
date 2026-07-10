export type PlanId = 'free-local' | 'pro';
export type SubscriptionStatus =
  'active' | 'canceled' | 'expired' | 'free' | 'past-due' | 'trialing' | 'unknown';

export type PremiumFeatureId =
  | 'advanced-bulk-actions'
  | 'ai-digest'
  | 'ai-cache-audit-reports'
  | 'ai-credit-packs'
  | 'ai-folder-suggestions'
  | 'ai-job-center'
  | 'ai-summaries'
  | 'auto-tags'
  | 'batch-export'
  | 'billing-seat-attribution'
  | 'branded-export-templates'
  | 'client-handoff-reports'
  | 'cloud-sync'
  | 'compliance-audit-exports'
  | 'conflict-timeline-restore'
  | 'conversation-detection-diagnostics'
  | 'duplicate-detection'
  | 'feature-readiness-matrix'
  | 'managed-provider-key-vault'
  | 'multi-provider-workspaces'
  | 'pdf-export'
  | 'premium-workspace-templates'
  | 'prompt-library'
  | 'priority-compatibility-alerts'
  | 'priority-support-diagnostics'
  | 'pro-diagnostic-health-reports'
  | 'pro-release-channels'
  | 'release-readiness-audits'
  | 'saved-export-profiles'
  | 'scheduled-encrypted-backups'
  | 'semantic-search'
  | 'smart-cleanup'
  | 'team-workspaces'
  | 'versioned-restore-points'
  | 'workspace-health-checks'
  | 'workspace-backup-restore';

export type FreeFeatureId =
  | 'basic-search'
  | 'conversation-assignment'
  | 'favorites'
  | 'folder-management'
  | 'local-backup'
  | 'local-persistence'
  | 'markdown-export';

export type FeatureId = FreeFeatureId | PremiumFeatureId;

export interface FeatureDefinition {
  readonly description: string;
  readonly id: FeatureId;
  readonly name: string;
  readonly tier: 'free' | 'premium';
}

export interface PlanDefinition {
  readonly description: string;
  readonly features: readonly FeatureId[];
  readonly id: PlanId;
  readonly name: string;
  readonly requiresSignIn: boolean;
}

export interface EntitlementState {
  readonly accountEmail: string | null;
  readonly accountId: string | null;
  readonly billingPortalUrl: string | null;
  readonly planId: PlanId;
  readonly signedIn: boolean;
  readonly subscriptionCheckedAt: string | null;
  readonly subscriptionStatus: SubscriptionStatus;
}

export interface AccountIdentity {
  readonly email: string | null;
  readonly id: string | null;
  readonly status: 'signed-in' | 'signed-out';
}
