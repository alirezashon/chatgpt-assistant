import type { PremiumFeatureId } from '@/features/entitlements/entitlement-types';

export type PremiumFeatureRequirement =
  'account' | 'external-ai-consent' | 'provider-key' | 'workspace-cloud';

export type PremiumFeatureReadinessStatus = 'blocked' | 'ready';

export interface PremiumFeatureAccessPolicy {
  readonly featureId: PremiumFeatureId;
  readonly requirements: readonly PremiumFeatureRequirement[];
}

export interface PremiumFeatureReadinessInput {
  readonly accountConnected: boolean;
  readonly externalAIConsentAccepted: boolean;
  readonly providerKeyConfigured: boolean;
  readonly workspaceCloudConfigured: boolean;
}

export interface PremiumFeatureReadiness {
  readonly featureId: PremiumFeatureId;
  readonly missingRequirements: readonly PremiumFeatureRequirement[];
  readonly status: PremiumFeatureReadinessStatus;
}

export const PREMIUM_FEATURE_ACCESS_POLICIES: Readonly<
  Record<PremiumFeatureId, PremiumFeatureAccessPolicy>
> = {
  'advanced-bulk-actions': {
    featureId: 'advanced-bulk-actions',
    requirements: ['account'],
  },
  'ai-cache-audit-reports': {
    featureId: 'ai-cache-audit-reports',
    requirements: ['account'],
  },
  'ai-credit-packs': {
    featureId: 'ai-credit-packs',
    requirements: ['account'],
  },
  'ai-digest': {
    featureId: 'ai-digest',
    requirements: ['account', 'external-ai-consent', 'provider-key'],
  },
  'ai-folder-suggestions': {
    featureId: 'ai-folder-suggestions',
    requirements: ['account', 'external-ai-consent', 'provider-key'],
  },
  'ai-job-center': {
    featureId: 'ai-job-center',
    requirements: ['account', 'external-ai-consent', 'provider-key'],
  },
  'ai-summaries': {
    featureId: 'ai-summaries',
    requirements: ['account', 'external-ai-consent', 'provider-key'],
  },
  'auto-tags': {
    featureId: 'auto-tags',
    requirements: ['account', 'external-ai-consent', 'provider-key'],
  },
  'batch-export': {
    featureId: 'batch-export',
    requirements: ['account'],
  },
  'billing-seat-attribution': {
    featureId: 'billing-seat-attribution',
    requirements: ['account', 'workspace-cloud'],
  },
  'branded-export-templates': {
    featureId: 'branded-export-templates',
    requirements: ['account'],
  },
  'client-handoff-reports': {
    featureId: 'client-handoff-reports',
    requirements: ['account'],
  },
  'cloud-sync': {
    featureId: 'cloud-sync',
    requirements: ['account', 'workspace-cloud'],
  },
  'compliance-audit-exports': {
    featureId: 'compliance-audit-exports',
    requirements: ['account'],
  },
  'conflict-timeline-restore': {
    featureId: 'conflict-timeline-restore',
    requirements: ['account'],
  },
  'conversation-detection-diagnostics': {
    featureId: 'conversation-detection-diagnostics',
    requirements: ['account'],
  },
  'duplicate-detection': {
    featureId: 'duplicate-detection',
    requirements: ['account'],
  },
  'feature-readiness-matrix': {
    featureId: 'feature-readiness-matrix',
    requirements: ['account'],
  },
  'managed-provider-key-vault': {
    featureId: 'managed-provider-key-vault',
    requirements: ['account'],
  },
  'multi-provider-workspaces': {
    featureId: 'multi-provider-workspaces',
    requirements: ['account', 'provider-key'],
  },
  'pdf-export': {
    featureId: 'pdf-export',
    requirements: ['account'],
  },
  'premium-workspace-templates': {
    featureId: 'premium-workspace-templates',
    requirements: ['account'],
  },
  'prompt-library': {
    featureId: 'prompt-library',
    requirements: ['account'],
  },
  'priority-compatibility-alerts': {
    featureId: 'priority-compatibility-alerts',
    requirements: ['account'],
  },
  'priority-support-diagnostics': {
    featureId: 'priority-support-diagnostics',
    requirements: ['account'],
  },
  'pro-diagnostic-health-reports': {
    featureId: 'pro-diagnostic-health-reports',
    requirements: ['account'],
  },
  'pro-release-channels': {
    featureId: 'pro-release-channels',
    requirements: ['account'],
  },
  'release-readiness-audits': {
    featureId: 'release-readiness-audits',
    requirements: ['account', 'workspace-cloud'],
  },
  'saved-export-profiles': {
    featureId: 'saved-export-profiles',
    requirements: ['account'],
  },
  'scheduled-encrypted-backups': {
    featureId: 'scheduled-encrypted-backups',
    requirements: ['account', 'workspace-cloud'],
  },
  'semantic-search': {
    featureId: 'semantic-search',
    requirements: ['account', 'external-ai-consent', 'provider-key'],
  },
  'smart-cleanup': {
    featureId: 'smart-cleanup',
    requirements: ['account'],
  },
  'team-workspaces': {
    featureId: 'team-workspaces',
    requirements: ['account', 'workspace-cloud'],
  },
  'versioned-restore-points': {
    featureId: 'versioned-restore-points',
    requirements: ['account', 'workspace-cloud'],
  },
  'workspace-backup-restore': {
    featureId: 'workspace-backup-restore',
    requirements: ['account', 'workspace-cloud'],
  },
  'workspace-health-checks': {
    featureId: 'workspace-health-checks',
    requirements: ['account'],
  },
};

export function getPremiumFeatureAccessPolicy(
  featureId: PremiumFeatureId,
): PremiumFeatureAccessPolicy {
  return PREMIUM_FEATURE_ACCESS_POLICIES[featureId];
}

export function requiresExternalAIConsent(featureId: PremiumFeatureId): boolean {
  return getPremiumFeatureAccessPolicy(featureId).requirements.includes('external-ai-consent');
}

export function requiresWorkspaceCloud(featureId: PremiumFeatureId): boolean {
  return getPremiumFeatureAccessPolicy(featureId).requirements.includes('workspace-cloud');
}

export function getPremiumFeatureReadiness(
  featureId: PremiumFeatureId,
  input: PremiumFeatureReadinessInput,
): PremiumFeatureReadiness {
  const missingRequirements = getPremiumFeatureAccessPolicy(featureId).requirements.filter(
    (requirement) => !isRequirementSatisfied(requirement, input),
  );

  return {
    featureId,
    missingRequirements,
    status: missingRequirements.length === 0 ? 'ready' : 'blocked',
  };
}

function isRequirementSatisfied(
  requirement: PremiumFeatureRequirement,
  input: PremiumFeatureReadinessInput,
): boolean {
  switch (requirement) {
    case 'account':
      return input.accountConnected;
    case 'external-ai-consent':
      return input.externalAIConsentAccepted;
    case 'provider-key':
      return input.providerKeyConfigured;
    case 'workspace-cloud':
      return input.workspaceCloudConfigured;
  }
}
