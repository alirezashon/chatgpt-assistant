export type PlanId = 'free-local' | 'pro';

export type PremiumFeatureId =
  | 'advanced-bulk-actions'
  | 'ai-digest'
  | 'ai-folder-suggestions'
  | 'ai-summaries'
  | 'batch-export'
  | 'branded-export-templates'
  | 'cloud-sync'
  | 'duplicate-detection'
  | 'pdf-export'
  | 'prompt-library'
  | 'semantic-search';

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
  readonly planId: PlanId;
  readonly signedIn: boolean;
}
