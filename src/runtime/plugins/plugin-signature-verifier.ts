import { PluginRuntimeError, type PluginPackage } from './plugin-types';

/** Verifies plugin package signatures and source integrity assertions. */
export interface PluginSignatureVerifier {
  /** Verifies a package or throws a PluginRuntimeError. */
  verify(pluginPackage: PluginPackage): Promise<void> | void;
}

/** Verifies manifest securityPolicy.signature against an explicit source digest. */
export class DigestPluginSignatureVerifier implements PluginSignatureVerifier {
  /** Verifies digest equality when signatures are required. */
  public verify(pluginPackage: PluginPackage): void {
    const signature = pluginPackage.manifest.securityPolicy.signature;

    if (!pluginPackage.manifest.securityPolicy.requireSignature) {
      return;
    }

    if (signature === undefined || pluginPackage.sourceDigest === undefined) {
      throw new PluginRuntimeError(
        'PLUGIN_SIGNATURE_INVALID',
        `Plugin signature is required: ${pluginPackage.manifest.id}`,
      );
    }

    if (signature !== pluginPackage.sourceDigest) {
      throw new PluginRuntimeError(
        'PLUGIN_SIGNATURE_INVALID',
        `Plugin signature does not match source digest: ${pluginPackage.manifest.id}`,
      );
    }
  }
}
