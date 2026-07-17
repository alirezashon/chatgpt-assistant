import type {
  MarketplaceInstallation,
  MarketplaceListing,
  MarketplaceVersion,
} from './marketplace-types';
import { MarketplaceRuntimeError } from './marketplace-types';

/** Handles install, enable, disable, update, rollback, and remove lifecycle. */
export class MarketplaceInstallationManager {
  private readonly installations = new Map<string, MarketplaceInstallation>();

  /** Installs a listing version. */
  public install(input: {
    readonly listing: MarketplaceListing;
    readonly organizationId?: string;
    readonly permissionsAccepted: readonly string[];
    readonly userId: string;
    readonly version: MarketplaceVersion;
  }): MarketplaceInstallation {
    assertPermissionsAccepted(input.version, input.permissionsAccepted);
    const installation: MarketplaceInstallation = {
      applicationId: input.listing.applicationId,
      id: crypto.randomUUID(),
      installedAt: Date.now(),
      ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
      packageName: input.listing.packageName,
      permissionsAccepted: input.permissionsAccepted,
      status: 'enabled',
      updatedAt: Date.now(),
      userId: input.userId,
      versionId: input.version.id,
    };
    this.installations.set(installation.id, installation);
    return installation;
  }

  /** Enables installation. */
  public enable(installationId: string): MarketplaceInstallation {
    return this.setStatus(installationId, 'enabled');
  }

  /** Disables installation. */
  public disable(installationId: string): MarketplaceInstallation {
    return this.setStatus(installationId, 'disabled');
  }

  /** Removes installation. */
  public remove(installationId: string): MarketplaceInstallation {
    return this.setStatus(installationId, 'removed');
  }

  /** Updates installation to a newer version. */
  public update(installationId: string, version: MarketplaceVersion): MarketplaceInstallation {
    const installation = this.require(installationId);
    assertPermissionsAccepted(version, installation.permissionsAccepted);
    const next: MarketplaceInstallation = {
      ...installation,
      previousVersionId: installation.versionId,
      updatedAt: Date.now(),
      versionId: version.id,
    };
    this.installations.set(installationId, next);
    return next;
  }

  /** Rolls back to previous version. */
  public rollback(installationId: string): MarketplaceInstallation {
    const installation = this.require(installationId);

    if (installation.previousVersionId === undefined) {
      throw new MarketplaceRuntimeError('MARKETPLACE_NOT_FOUND', 'No previous version available for rollback.');
    }

    const next: MarketplaceInstallation = {
      ...installation,
      updatedAt: Date.now(),
      versionId: installation.previousVersionId,
    };
    this.installations.set(installationId, next);
    return next;
  }

  /** Lists installations. */
  public list(input: { readonly organizationId?: string; readonly userId?: string } = {}): readonly MarketplaceInstallation[] {
    return [...this.installations.values()]
      .filter((installation) => input.userId === undefined || installation.userId === input.userId)
      .filter((installation) => input.organizationId === undefined || installation.organizationId === input.organizationId);
  }

  private setStatus(installationId: string, status: MarketplaceInstallation['status']): MarketplaceInstallation {
    const installation = this.require(installationId);
    const next = {
      ...installation,
      status,
      updatedAt: Date.now(),
    };
    this.installations.set(installationId, next);
    return next;
  }

  private require(installationId: string): MarketplaceInstallation {
    const installation = this.installations.get(installationId);

    if (installation === undefined) {
      throw new MarketplaceRuntimeError('MARKETPLACE_NOT_FOUND', `Installation not found: ${installationId}`);
    }

    return installation;
  }
}

function assertPermissionsAccepted(version: MarketplaceVersion, accepted: readonly string[]): void {
  const missing = version.manifest.permissions.filter((permission) => !accepted.includes(permission));

  if (missing.length > 0) {
    throw new MarketplaceRuntimeError('MARKETPLACE_PERMISSION_DENIED', 'Package permissions were not accepted.', {
      missing: missing.join(','),
    });
  }
}
