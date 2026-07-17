import { createListing, MarketplaceCatalog } from './catalog';
import { DeveloperPortal } from './developer-portal';
import { MarketplaceInstallationManager } from './installation-manager';
import { MarketplaceAnalytics } from './marketplace-analytics';
import { MarketplacePublishingPipeline, scanAutoApproved } from './publishing-pipeline';
import type {
  DeveloperAccount,
  DeveloperProject,
  MarketplaceApplication,
  MarketplaceCategory,
  MarketplaceDistribution,
  MarketplaceInstallation,
  MarketplaceListing,
  MarketplacePackageBundle,
  MarketplacePackageType,
  MarketplacePricing,
  MarketplaceSearchQuery,
  MarketplaceVersion,
} from './marketplace-types';
import { MarketplaceRuntimeError } from './marketplace-types';

/** Marketplace runtime dependencies. */
export interface MarketplaceRuntimeDependencies {
  readonly analytics?: MarketplaceAnalytics;
  readonly catalog?: MarketplaceCatalog;
  readonly developers?: DeveloperPortal;
  readonly installations?: MarketplaceInstallationManager;
  readonly publishing?: MarketplacePublishingPipeline;
}

/** Developer ecosystem and marketplace runtime facade. */
export class MarketplaceRuntime {
  public readonly analytics: MarketplaceAnalytics;
  public readonly catalog: MarketplaceCatalog;
  public readonly developers: DeveloperPortal;
  public readonly installations: MarketplaceInstallationManager;
  public readonly publishing: MarketplacePublishingPipeline;

  private readonly applications = new Map<string, MarketplaceApplication>();
  private readonly versions = new Map<string, MarketplaceVersion>();

  public constructor(dependencies: MarketplaceRuntimeDependencies = {}) {
    this.analytics = dependencies.analytics ?? new MarketplaceAnalytics();
    this.catalog = dependencies.catalog ?? new MarketplaceCatalog();
    this.developers = dependencies.developers ?? new DeveloperPortal();
    this.installations = dependencies.installations ?? new MarketplaceInstallationManager();
    this.publishing = dependencies.publishing ?? new MarketplacePublishingPipeline();
  }

  /** Creates developer account. */
  public createDeveloper(input: Parameters<DeveloperPortal['createDeveloper']>[0]): DeveloperAccount {
    return this.developers.createDeveloper(input);
  }

  /** Creates developer project. */
  public createProject(input: Parameters<DeveloperPortal['createProject']>[0]): DeveloperProject {
    return this.developers.createProject(input);
  }

  /** Creates marketplace application shell. */
  public createApplication(input: {
    readonly category: MarketplaceCategory;
    readonly developerId: string;
    readonly displayName: string;
    readonly distribution?: MarketplaceDistribution;
    readonly organizationId?: string;
    readonly packageName: string;
    readonly pricing?: MarketplacePricing;
    readonly projectId: string;
    readonly summary: string;
    readonly type: MarketplacePackageType;
  }): MarketplaceApplication {
    this.developers.requireDeveloper(input.developerId);
    const project = this.developers.requireProject(input.projectId);

    if (project.developerId !== input.developerId) {
      throw new MarketplaceRuntimeError('MARKETPLACE_PERMISSION_DENIED', 'Project does not belong to developer.');
    }

    const application: MarketplaceApplication = {
      category: input.category,
      createdAt: Date.now(),
      developerId: input.developerId,
      displayName: input.displayName,
      distribution: input.distribution ?? 'public',
      id: crypto.randomUUID(),
      packageName: input.packageName,
      pricing: input.pricing ?? freePricing(),
      projectId: input.projectId,
      summary: input.summary,
      type: input.type,
      ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
    };
    this.applications.set(application.id, application);
    return application;
  }

  /** Publishes package version through validation and security review. */
  public publishVersion(input: {
    readonly applicationId: string;
    readonly bundle: MarketplacePackageBundle;
    readonly releaseNotes: string;
    readonly version: string;
  }): MarketplaceVersion {
    const application = this.requireApplication(input.applicationId);

    if (application.packageName !== input.bundle.manifest.packageName || application.type !== input.bundle.manifest.type) {
      throw new MarketplaceRuntimeError('MARKETPLACE_VALIDATION_FAILED', 'Bundle manifest does not match application.');
    }

    const version = this.publishing.submit(input);
    this.versions.set(version.id, version);

    if (scanAutoApproved(version.scan)) {
      this.listApprovedVersion(version.id);
    }

    return version;
  }

  /** Applies human review and lists approved versions. */
  public reviewVersion(input: {
    readonly decision: 'approve' | 'reject';
    readonly reason: string;
    readonly versionId: string;
  }): MarketplaceVersion {
    const version = this.requireVersion(input.versionId);
    const reviewed = this.publishing.humanReview(version, input.decision, input.reason);
    this.versions.set(reviewed.id, reviewed);

    if (reviewed.status === 'approved') {
      this.listApprovedVersion(reviewed.id);
    }

    return reviewed;
  }

  /** Searches catalog. */
  public search(query: MarketplaceSearchQuery): readonly MarketplaceListing[] {
    return this.catalog.search(query);
  }

  /** Installs package. */
  public install(input: {
    readonly applicationId: string;
    readonly organizationId?: string;
    readonly permissionsAccepted: readonly string[];
    readonly userId: string;
  }): MarketplaceInstallation {
    const listing = this.requireListing(input.applicationId, input.organizationId);
    const version = this.requireVersion(listing.approvedVersionId);
    const installation = this.installations.install({
      listing,
      ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
      permissionsAccepted: input.permissionsAccepted,
      userId: input.userId,
      version,
    });
    this.incrementInstallCount(listing.applicationId);
    this.analytics.record({
      applicationId: listing.applicationId,
      developerId: listing.developerId,
      type: 'install',
      value: 1,
    });
    this.monetizeInstall(listing);
    return installation;
  }

  /** Updates installation to currently approved version. */
  public updateInstallation(installationId: string, applicationId: string): MarketplaceInstallation {
    const listing = this.requireListing(applicationId);
    const version = this.requireVersion(listing.approvedVersionId);
    return this.installations.update(installationId, version);
  }

  /** Adds review. */
  public addReview(input: Parameters<MarketplaceCatalog['addReview']>[0]) {
    return this.catalog.addReview(input);
  }

  /** Developer analytics. */
  public developerAnalytics(developerId: string) {
    return this.analytics.byDeveloper(developerId);
  }

  /** Developer revenue. */
  public developerRevenue(developerId: string) {
    return this.analytics.revenueByDeveloper(developerId);
  }

  private listApprovedVersion(versionId: string): void {
    const version = this.requireVersion(versionId);
    const application = this.requireApplication(version.applicationId);
    const developer = this.developers.requireDeveloper(application.developerId);
    const listing = createListing({
      applicationId: application.id,
      approvedVersionId: version.id,
      category: application.category,
      developer,
      displayName: application.displayName,
      distribution: application.distribution,
      packageName: application.packageName,
      pricing: application.pricing,
      securityScore: version.scan?.score ?? 0,
      summary: application.summary,
      tags: [application.type, application.category],
      type: application.type,
      ...(application.organizationId === undefined ? {} : { organizationId: application.organizationId }),
    });
    const existing = this.catalog.get(application.id);
    this.catalog.upsert({
      ...listing,
      installCount: existing?.installCount ?? 0,
      ratingAverage: existing?.ratingAverage ?? 0,
      reviewCount: existing?.reviewCount ?? 0,
    });
  }

  private incrementInstallCount(applicationId: string): void {
    const listing = this.catalog.get(applicationId);

    if (listing !== undefined) {
      this.catalog.upsert({
        ...listing,
        installCount: listing.installCount + 1,
        updatedAt: Date.now(),
      });
    }
  }

  private monetizeInstall(listing: MarketplaceListing): void {
    if (listing.pricing.model === 'free') {
      return;
    }

    this.analytics.recordRevenue({
      applicationId: listing.applicationId,
      currency: listing.pricing.currency,
      developerId: listing.developerId,
      grossCents: listing.pricing.priceCents,
      revenueShareBps: listing.pricing.revenueShareBps,
    });
  }

  private requireApplication(applicationId: string): MarketplaceApplication {
    const application = this.applications.get(applicationId);

    if (application === undefined) {
      throw new MarketplaceRuntimeError('MARKETPLACE_NOT_FOUND', `Application not found: ${applicationId}`);
    }

    return application;
  }

  private requireVersion(versionId: string): MarketplaceVersion {
    const version = this.versions.get(versionId);

    if (version === undefined) {
      throw new MarketplaceRuntimeError('MARKETPLACE_NOT_FOUND', `Version not found: ${versionId}`);
    }

    return version;
  }

  private requireListing(applicationId: string, organizationId?: string): MarketplaceListing {
    const listing = this.catalog.get(applicationId);

    if (listing === undefined) {
      throw new MarketplaceRuntimeError('MARKETPLACE_NOT_FOUND', `Listing not found: ${applicationId}`);
    }

    if (
      listing.distribution === 'enterprise-private' &&
      (organizationId === undefined || listing.organizationId !== organizationId)
    ) {
      throw new MarketplaceRuntimeError('MARKETPLACE_INSTALL_DENIED', 'Private listing is not visible to this organization.');
    }

    return listing;
  }
}

function freePricing(): MarketplacePricing {
  return {
    currency: 'USD',
    model: 'free',
    priceCents: 0,
    revenueShareBps: 0,
  };
}
