import { describe, expect, it } from 'vitest';

import { PluginRuntime } from './plugin-runtime';
import type {
  PluginCapability,
  PluginManifest,
  PluginModule,
  PluginPackage,
  PluginType,
} from './plugin-types';

const limits = {
  activationTimeoutMs: 100,
  maxEventSubscriptions: 5,
  memoryMb: 16,
};

describe('PluginRuntime', () => {
  it('installs and activates a command plugin through the SDK boundary', async () => {
    const runtime = new PluginRuntime({ kernelVersion: '1.0.0' });
    const pluginPackage = createPackage({
      commands: [
        {
          description: 'Generates tests.',
          id: 'tests.generate',
          title: 'Generate Tests',
        },
      ],
      module: {
        activate: (sdk) => {
          sdk.commands.register('tests.generate', () => 'ok');
        },
        dispose: () => undefined,
      },
      permissions: ['command.register'],
      types: ['command'],
    });

    await expect(runtime.install(pluginPackage)).resolves.toMatchObject({ ok: true });
    await expect(runtime.activate(pluginPackage.manifest.id)).resolves.toMatchObject({ ok: true });

    expect(runtime.contributions.listCommands()).toHaveLength(1);
    expect(runtime.registry.getState(pluginPackage.manifest.id)).toBe('activated');
  });

  it('rejects manifests whose contributions do not declare required capabilities', async () => {
    const runtime = new PluginRuntime({ kernelVersion: '1.0.0' });
    const pluginPackage = createPackage({
      commands: [
        {
          description: 'Missing capability.',
          id: 'bad.command',
          title: 'Bad Command',
        },
      ],
      permissions: [],
      types: ['command'],
    });

    const result = await runtime.install(pluginPackage);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe('PLUGIN_INVALID_MANIFEST');
  });

  it('contains plugin failures when a denied capability is used', async () => {
    const runtime = new PluginRuntime({ kernelVersion: '1.0.0' });
    const pluginPackage = createPackage({
      module: {
        activate: async (sdk) => {
          await sdk.storage.set('secret', 'value');
        },
        dispose: () => undefined,
      },
      permissions: ['storage.write'],
      types: ['data'],
    });

    await expect(runtime.install(pluginPackage, [])).resolves.toMatchObject({ ok: true });
    const activation = await runtime.activate(pluginPackage.manifest.id);
    const health = await runtime.health();

    expect(activation.ok).toBe(false);
    expect(runtime.registry.getState(pluginPackage.manifest.id)).toBe('failed');
    expect(health[pluginPackage.manifest.id]?.status).toBe('unhealthy');
  });

  it('rejects packages with invalid required signatures', async () => {
    const runtime = new PluginRuntime({ kernelVersion: '1.0.0' });
    const pluginPackage = createPackage({
      securityPolicy: {
        requireSignature: true,
        resourceLimits: limits,
        signature: 'sha256:expected',
      },
      sourceDigest: 'sha256:actual',
    });

    const result = await runtime.install(pluginPackage);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe('PLUGIN_SIGNATURE_INVALID');
  });

  it('fails activation when dependencies are missing', async () => {
    const runtime = new PluginRuntime({ kernelVersion: '1.0.0' });
    const pluginPackage = createPackage({
      dependencies: [{ id: 'com.acme.base', minimumVersion: '1.0.0' }],
    });

    await expect(runtime.install(pluginPackage)).resolves.toMatchObject({ ok: true });
    const activation = await runtime.activate(pluginPackage.manifest.id);

    expect(activation.ok).toBe(false);
    expect(activation.ok ? undefined : activation.error.code).toBe('PLUGIN_DEPENDENCY_MISSING');
  });

  it('routes plugin events through the event bus only when capabilities are granted', async () => {
    const runtime = new PluginRuntime({ kernelVersion: '1.0.0' });
    const received: unknown[] = [];
    const pluginPackage = createPackage({
      module: {
        activate: async (sdk) => {
          sdk.events.subscribe('demo.ready', (payload) => {
            received.push(payload);
          });
          await sdk.events.publish('demo.ready', { ready: true });
        },
        dispose: () => undefined,
      },
      permissions: ['events.publish', 'events.subscribe'],
      types: ['automation'],
    });

    await runtime.install(pluginPackage);
    await runtime.activate(pluginPackage.manifest.id);

    expect(received).toEqual([{ ready: true }]);
  });
});

function createPackage(input: {
  readonly aiTools?: PluginManifest['aiTools'];
  readonly commands?: PluginManifest['commands'];
  readonly contexts?: PluginManifest['contexts'];
  readonly dependencies?: PluginManifest['dependencies'];
  readonly module?: PluginModule;
  readonly permissions?: readonly PluginCapability[];
  readonly securityPolicy?: PluginManifest['securityPolicy'];
  readonly sourceDigest?: string;
  readonly types?: readonly PluginType[];
  readonly uiSurfaces?: PluginManifest['uiSurfaces'];
}): PluginPackage {
  const manifest: PluginManifest = {
    ...(input.aiTools === undefined ? {} : { aiTools: input.aiTools }),
    author: {
      name: 'Acme',
      url: 'https://example.com',
    },
    capabilities: input.types ?? ['command'],
    ...(input.commands === undefined ? {} : { commands: input.commands }),
    ...(input.contexts === undefined ? {} : { contexts: input.contexts }),
    ...(input.dependencies === undefined ? {} : { dependencies: input.dependencies }),
    description: 'Test plugin.',
    id: 'com.acme.plugin',
    license: 'UNLICENSED',
    minimumKernelVersion: '1.0.0',
    name: 'Acme Plugin',
    permissions: input.permissions ?? [],
    securityPolicy: input.securityPolicy ?? {
      requireSignature: false,
      resourceLimits: limits,
    },
    ...(input.uiSurfaces === undefined ? {} : { uiSurfaces: input.uiSurfaces }),
    version: '1.0.0',
  };

  return {
    manifest,
    moduleFactory: () =>
      input.module ?? {
        dispose: () => undefined,
      },
    ...(input.sourceDigest === undefined ? {} : { sourceDigest: input.sourceDigest }),
  };
}
