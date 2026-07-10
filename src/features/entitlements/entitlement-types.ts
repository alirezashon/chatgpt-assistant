export type PlanId = 'free-local' | 'pro';

export type PremiumFeatureId =
  | 'advanced-bulk-actions'
  | 'ai-digest'
  | 'ai-folder-suggestions'
  | 'ai-summaries'
  | 'batch-export'
  | 'cloud-sync'
  | 'pdf-export'
  | 'semantic-search';

export type FreeFeatureId =
  'basic-search' | 'favorites' | 'folder-management' | 'local-persistence';

export type FeatureId = FreeFeatureId | PremiumFeatureId;

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
