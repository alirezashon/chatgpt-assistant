/** Stable Marketplace Runtime version. */
export const MARKETPLACE_RUNTIME_VERSION = '1.0.0';

/** JSON-like marketplace value. */
export type MarketplaceValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: MarketplaceValue }
  | readonly MarketplaceValue[];

/** Package type. */
export type MarketplacePackageType =
  | 'agent'
  | 'ai-tool'
  | 'command'
  | 'connector'
  | 'knowledge-pack'
  | 'plugin'
  | 'template'
  | 'workflow';

/** Catalog category. */
export type MarketplaceCategory =
  | 'automation'
  | 'connectors'
  | 'development'
  | 'finance'
  | 'knowledge-packs'
  | 'productivity'
  | 'research'
  | 'sales'
  | 'security'
  | 'templates';

/** Version status. */
export type MarketplaceVersionStatus =
  | 'approved'
  | 'deprecated'
  | 'draft'
  | 'rejected'
  | 'reviewing'
  | 'revoked';

/** Monetization model. */
export type MarketplacePricingModel = 'enterprise-license' | 'free' | 'paid' | 'subscription' | 'usage-based';

/** Distribution channel. */
export type MarketplaceDistribution = 'enterprise-private' | 'internal' | 'public' | 'unlisted';

/** Install status. */
export type MarketplaceInstallStatus = 'disabled' | 'enabled' | 'installed' | 'removed';

/** Review status. */
export type MarketplaceReviewStatus = 'approved' | 'blocked' | 'needs-human-review' | 'rejected';

/** Permission risk. */
export type MarketplacePermissionRisk = 'critical' | 'high' | 'low' | 'medium';

/** Developer account. */
export interface DeveloperAccount {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly verified: boolean;
  readonly createdAt: number;
}

/** Developer profile. */
export interface DeveloperProfile {
  readonly developerId: string;
  readonly bio: string;
  readonly website?: string;
  readonly followers: readonly string[];
  readonly badges: readonly string[];
}

/** API key metadata. */
export interface DeveloperApiKey {
  readonly id: string;
  readonly developerId: string;
  readonly name: string;
  readonly keyPrefix: string;
  readonly scopes: readonly string[];
  readonly createdAt: number;
  readonly revokedAt?: number;
}

/** Developer project. */
export interface DeveloperProject {
  readonly id: string;
  readonly developerId: string;
  readonly name: string;
  readonly description: string;
  readonly createdAt: number;
}

/** Marketplace application. */
export interface MarketplaceApplication {
  readonly id: string;
  readonly developerId: string;
  readonly projectId: string;
  readonly packageName: string;
  readonly displayName: string;
  readonly summary: string;
  readonly type: MarketplacePackageType;
  readonly category: MarketplaceCategory;
  readonly distribution: MarketplaceDistribution;
  readonly organizationId?: string;
  readonly pricing: MarketplacePricing;
  readonly createdAt: number;
}

/** Pricing. */
export interface MarketplacePricing {
  readonly model: MarketplacePricingModel;
  readonly priceCents: number;
  readonly currency: string;
  readonly revenueShareBps: number;
}

/** Package dependency. */
export interface MarketplaceDependency {
  readonly packageName: string;
  readonly versionRange: string;
  readonly optional: boolean;
}

/** Compatibility. */
export interface MarketplaceCompatibility {
  readonly minPlatformVersion: string;
  readonly maxPlatformVersion?: string;
  readonly runtimes: readonly string[];
}

/** Package manifest. */
export interface MarketplacePackageManifest {
  readonly packageName: string;
  readonly type: MarketplacePackageType;
  readonly displayName: string;
  readonly description: string;
  readonly permissions: readonly string[];
  readonly dependencies: readonly MarketplaceDependency[];
  readonly configuration: Readonly<Record<string, MarketplaceValue>>;
  readonly compatibility: MarketplaceCompatibility;
  readonly entrypoints: readonly string[];
}

/** Package contents. */
export interface MarketplacePackageBundle {
  readonly manifest: MarketplacePackageManifest;
  readonly codeFiles: Readonly<Record<string, string>>;
  readonly assets: Readonly<Record<string, string>>;
  readonly docs: Readonly<Record<string, string>>;
  readonly checksum: string;
}

/** Application version. */
export interface MarketplaceVersion {
  readonly id: string;
  readonly applicationId: string;
  readonly version: string;
  readonly manifest: MarketplacePackageManifest;
  readonly bundle: MarketplacePackageBundle;
  readonly status: MarketplaceVersionStatus;
  readonly scan?: MarketplaceSecurityScan;
  readonly releaseNotes: string;
  readonly migrationNotes?: string;
  readonly createdAt: number;
  readonly approvedAt?: number;
}

/** Security scan finding. */
export interface MarketplaceSecurityFinding {
  readonly id: string;
  readonly type:
    | 'ai-behavior'
    | 'dependency'
    | 'malware'
    | 'permission'
    | 'sandbox'
    | 'static-analysis';
  readonly severity: MarketplacePermissionRisk;
  readonly message: string;
  readonly evidence: readonly string[];
}

/** Security scan. */
export interface MarketplaceSecurityScan {
  readonly id: string;
  readonly versionId: string;
  readonly score: number;
  readonly status: MarketplaceReviewStatus;
  readonly findings: readonly MarketplaceSecurityFinding[];
  readonly requiresHumanReview: boolean;
  readonly createdAt: number;
}

/** Catalog listing. */
export interface MarketplaceListing {
  readonly applicationId: string;
  readonly approvedVersionId: string;
  readonly packageName: string;
  readonly displayName: string;
  readonly summary: string;
  readonly type: MarketplacePackageType;
  readonly category: MarketplaceCategory;
  readonly distribution: MarketplaceDistribution;
  readonly organizationId?: string;
  readonly developerId: string;
  readonly securityScore: number;
  readonly trustScore: number;
  readonly installCount: number;
  readonly ratingAverage: number;
  readonly reviewCount: number;
  readonly pricing: MarketplacePricing;
  readonly tags: readonly string[];
  readonly updatedAt: number;
}

/** Installation. */
export interface MarketplaceInstallation {
  readonly id: string;
  readonly applicationId: string;
  readonly versionId: string;
  readonly packageName: string;
  readonly userId: string;
  readonly organizationId?: string;
  readonly status: MarketplaceInstallStatus;
  readonly permissionsAccepted: readonly string[];
  readonly installedAt: number;
  readonly updatedAt: number;
  readonly previousVersionId?: string;
}

/** Review. */
export interface MarketplaceUserReview {
  readonly id: string;
  readonly applicationId: string;
  readonly userId: string;
  readonly rating: number;
  readonly title: string;
  readonly body: string;
  readonly createdAt: number;
}

/** Abuse report. */
export interface MarketplaceAbuseReport {
  readonly id: string;
  readonly applicationId: string;
  readonly reporterId: string;
  readonly reason: string;
  readonly severity: MarketplacePermissionRisk;
  readonly createdAt: number;
}

/** Analytics event. */
export interface MarketplaceAnalyticsEvent {
  readonly id: string;
  readonly applicationId: string;
  readonly developerId: string;
  readonly type: 'active-user' | 'error' | 'install' | 'performance' | 'retention' | 'revenue' | 'uninstall';
  readonly value: number;
  readonly timestamp: number;
  readonly metadata: Readonly<Record<string, MarketplaceValue>>;
}

/** Revenue event. */
export interface MarketplaceRevenueEvent {
  readonly id: string;
  readonly applicationId: string;
  readonly developerId: string;
  readonly grossCents: number;
  readonly platformFeeCents: number;
  readonly developerNetCents: number;
  readonly currency: string;
  readonly timestamp: number;
}

/** Search query. */
export interface MarketplaceSearchQuery {
  readonly text?: string;
  readonly category?: MarketplaceCategory;
  readonly type?: MarketplacePackageType;
  readonly organizationId?: string;
  readonly includePrivate?: boolean;
  readonly limit?: number;
}

/** Runtime error code. */
export type MarketplaceRuntimeErrorCode =
  | 'MARKETPLACE_COMPATIBILITY_FAILED'
  | 'MARKETPLACE_INSTALL_DENIED'
  | 'MARKETPLACE_NOT_FOUND'
  | 'MARKETPLACE_PERMISSION_DENIED'
  | 'MARKETPLACE_PUBLISH_REJECTED'
  | 'MARKETPLACE_VALIDATION_FAILED';

/** Structured marketplace error. */
export class MarketplaceRuntimeError extends Error {
  readonly code: MarketplaceRuntimeErrorCode;
  readonly details: Readonly<Record<string, MarketplaceValue>> | undefined;

  public constructor(
    code: MarketplaceRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, MarketplaceValue>>,
  ) {
    super(message);
    this.name = 'MarketplaceRuntimeError';
    this.code = code;
    this.details = details;
  }
}
