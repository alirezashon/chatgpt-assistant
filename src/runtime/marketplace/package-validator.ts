import type { MarketplacePackageBundle, MarketplacePackageManifest } from './marketplace-types';
import { MarketplaceRuntimeError } from './marketplace-types';

/** Validates package manifest and bundle structure. */
export class MarketplacePackageValidator {
  /** Validates package bundle. */
  public validate(bundle: MarketplacePackageBundle): void {
    validateManifest(bundle.manifest);

    for (const entrypoint of bundle.manifest.entrypoints) {
      if (bundle.codeFiles[entrypoint] === undefined) {
        throw new MarketplaceRuntimeError('MARKETPLACE_VALIDATION_FAILED', `Missing entrypoint: ${entrypoint}`);
      }
    }

    if (bundle.checksum.trim().length < 8) {
      throw new MarketplaceRuntimeError('MARKETPLACE_VALIDATION_FAILED', 'Package checksum is invalid.');
    }
  }
}

function validateManifest(manifest: MarketplacePackageManifest): void {
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(manifest.packageName)) {
    throw new MarketplaceRuntimeError('MARKETPLACE_VALIDATION_FAILED', 'Package name must be kebab-case and at least 3 characters.');
  }

  if (manifest.displayName.trim().length === 0 || manifest.description.trim().length === 0) {
    throw new MarketplaceRuntimeError('MARKETPLACE_VALIDATION_FAILED', 'Package display name and description are required.');
  }

  if (manifest.compatibility.runtimes.length === 0) {
    throw new MarketplaceRuntimeError('MARKETPLACE_VALIDATION_FAILED', 'At least one runtime compatibility target is required.');
  }
}
