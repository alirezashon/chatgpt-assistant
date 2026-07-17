import { MarketplacePackageValidator } from './package-validator';
import { MarketplaceSecurityScanner } from './security-scanner';
import type {
  MarketplacePackageBundle,
  MarketplaceSecurityScan,
  MarketplaceVersion,
} from './marketplace-types';
import { MarketplaceRuntimeError } from './marketplace-types';

/** Publishing pipeline for validation, security scan, approval, and rejection. */
export class MarketplacePublishingPipeline {
  private readonly scanner = new MarketplaceSecurityScanner();
  private readonly validator = new MarketplacePackageValidator();

  /** Creates a submitted version and scan result. */
  public submit(input: {
    readonly applicationId: string;
    readonly bundle: MarketplacePackageBundle;
    readonly releaseNotes: string;
    readonly version: string;
  }): MarketplaceVersion {
    this.validator.validate(input.bundle);
    const versionId = crypto.randomUUID();
    const scan = this.scanner.scan(versionId, input.bundle);

    return {
      applicationId: input.applicationId,
      bundle: input.bundle,
      createdAt: Date.now(),
      id: versionId,
      manifest: input.bundle.manifest,
      releaseNotes: input.releaseNotes,
      scan,
      status: scan.status === 'approved' ? 'approved' : scan.status === 'blocked' ? 'rejected' : 'reviewing',
      version: input.version,
      ...(scan.status === 'approved' ? { approvedAt: Date.now() } : {}),
    };
  }

  /** Applies human review for versions that need it. */
  public humanReview(version: MarketplaceVersion, decision: 'approve' | 'reject', reason: string): MarketplaceVersion {
    if (version.scan?.status === 'blocked' && decision === 'approve') {
      throw new MarketplaceRuntimeError('MARKETPLACE_PUBLISH_REJECTED', 'Blocked security scan cannot be approved.', {
        reason,
        versionId: version.id,
      });
    }

    return {
      ...version,
      ...(decision === 'approve' ? { approvedAt: Date.now() } : {}),
      status: decision === 'approve' ? 'approved' : 'rejected',
    };
  }
}

/** Returns whether the scan can be listed without human review. */
export function scanAutoApproved(scan: MarketplaceSecurityScan | undefined): boolean {
  return scan?.status === 'approved' && !scan.requiresHumanReview;
}
