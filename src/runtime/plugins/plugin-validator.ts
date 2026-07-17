import {
  DigestPluginSignatureVerifier,
  type PluginSignatureVerifier,
} from './plugin-signature-verifier';
import { satisfiesMinimumVersion } from './plugin-version';
import type { PluginCapability, PluginManifest, PluginPackage } from './plugin-types';
import { PluginRuntimeError } from './plugin-types';

const PLUGIN_ID_PATTERN = /^[a-z][a-z0-9.-]{2,63}$/;
const KNOWN_CAPABILITIES: readonly PluginCapability[] = [
  'ai.request',
  'clipboard.read',
  'clipboard.write',
  'command.register',
  'config.read',
  'config.write',
  'context.read',
  'events.publish',
  'events.subscribe',
  'network.request',
  'notifications.show',
  'selection.read',
  'storage.read',
  'storage.write',
  'tabs.control',
  'tabs.read',
  'telemetry.write',
  'ui.register',
];

/** Validates plugin packages before registry installation. */
export class PluginValidator {
  public constructor(
    private readonly kernelVersion: string,
    private readonly signatures: PluginSignatureVerifier = new DigestPluginSignatureVerifier(),
  ) {}

  /** Validates package manifest, contribution permissions, kernel compatibility, and signature. */
  public async validatePackage(pluginPackage: PluginPackage): Promise<void> {
    this.validateManifest(pluginPackage.manifest);
    await this.signatures.verify(pluginPackage);
  }

  /** Validates a plugin manifest. */
  public validateManifest(manifest: PluginManifest): void {
    if (!PLUGIN_ID_PATTERN.test(manifest.id)) {
      throw new PluginRuntimeError('PLUGIN_INVALID_MANIFEST', `Invalid plugin id: ${manifest.id}`);
    }

    if (!satisfiesMinimumVersion(this.kernelVersion, manifest.minimumKernelVersion)) {
      throw new PluginRuntimeError(
        'PLUGIN_INVALID_MANIFEST',
        `Plugin requires kernel ${manifest.minimumKernelVersion}: ${manifest.id}`,
      );
    }

    for (const capability of manifest.permissions) {
      if (!KNOWN_CAPABILITIES.includes(capability)) {
        throw new PluginRuntimeError(
          'PLUGIN_INVALID_MANIFEST',
          `Unknown plugin capability: ${capability}`,
        );
      }
    }

    this.validateContributionCapabilities(manifest);
    this.validateDependencies(manifest);
  }

  private validateContributionCapabilities(manifest: PluginManifest): void {
    this.assertPermissionFor(manifest, manifest.commands, 'command.register', 'commands');
    this.assertPermissionFor(manifest, manifest.contexts, 'context.read', 'contexts');
    this.assertPermissionFor(manifest, manifest.aiTools, 'ai.request', 'aiTools');
    this.assertPermissionFor(manifest, manifest.uiSurfaces, 'ui.register', 'uiSurfaces');
  }

  private assertPermissionFor(
    manifest: PluginManifest,
    contributions: readonly unknown[] | undefined,
    capability: PluginCapability,
    contributionName: string,
  ): void {
    if ((contributions?.length ?? 0) === 0) {
      return;
    }

    if (!manifest.permissions.includes(capability)) {
      throw new PluginRuntimeError(
        'PLUGIN_INVALID_MANIFEST',
        `Plugin ${manifest.id} declares ${contributionName} without ${capability}`,
      );
    }
  }

  private validateDependencies(manifest: PluginManifest): void {
    for (const dependency of manifest.dependencies ?? []) {
      if (dependency.id === manifest.id) {
        throw new PluginRuntimeError(
          'PLUGIN_INVALID_MANIFEST',
          `Plugin cannot depend on itself: ${manifest.id}`,
        );
      }

      satisfiesMinimumVersion(dependency.minimumVersion, '0.0.0');
    }
  }
}
