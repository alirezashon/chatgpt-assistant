import { describe, expect, it } from 'vitest';

import { DeviceCapabilityDetector } from './device-capability-detector';
import { ExecutionPlanner } from './execution-planner';
import { HybridRuntime } from './hybrid-runtime';
import { ResourceManager } from './resource-manager';
import { SyncEngine } from './sync-engine';
import { HybridRuntimeError, type ExecutionRequest, type RuntimeDescriptor, type RuntimeExecutor } from './hybrid-types';

describe('HybridRuntime', () => {
  it('plans local execution for private local-capable requests', async () => {
    const runtime = new HybridRuntime({
      planner: new ExecutionPlanner(
        new DeviceCapabilityDetector({
          availableLocalModels: ['embed-small'],
          batteryLevel: 1,
          browserApis: ['storage'],
          charging: true,
          cpuCores: 8,
          gpuAvailable: true,
          hardwareAcceleration: true,
          network: 'excellent',
          ramMb: 16_384,
          storageQuotaMb: 5_000,
          wasm: true,
          webGpu: true,
        }),
      ),
    });
    runtime.registerExecutor(executor(localDescriptor, { vector: [1, 0] }));
    runtime.registerExecutor(executor(edgeDescriptor, { edge: true }));

    const result = await runtime.execute(request({
      capability: 'local-embedding',
      dataPlacement: 'never-leave-device',
      preferLocal: true,
    }));

    expect(result.target).toBe('local');
    expect(result.output).toMatchObject({ vector: [1, 0] });
    expect(runtime.telemetry.list(result.requestId).some((event) => event.type === 'placement-selected')).toBe(true);
  });

  it('falls back from failed local execution to edge and records migration', async () => {
    const runtime = new HybridRuntime();
    runtime.registerExecutor({
      descriptor: {
        ...localDescriptor,
        capabilities: ['workflow-execution'],
      },
      execute: () => {
        throw new Error('local failed');
      },
    });
    runtime.registerExecutor(executor({
      ...edgeDescriptor,
      capabilities: ['workflow-execution'],
    }, { ok: true }));

    const result = await runtime.execute(request({
      capability: 'workflow-execution',
      dataPlacement: 'can-use-edge',
      preferLocal: true,
    }));

    expect(result.output).toMatchObject({ ok: true });
    expect(runtime.migration.list()).toHaveLength(1);
  });

  it('queues work for offline execution when no online runtime is available', async () => {
    const runtime = new HybridRuntime({
      planner: new ExecutionPlanner(
        new DeviceCapabilityDetector({
          availableLocalModels: [],
          batteryLevel: 0.7,
          browserApis: ['storage'],
          charging: false,
          cpuCores: 4,
          gpuAvailable: false,
          hardwareAcceleration: true,
          network: 'offline',
          ramMb: 4_096,
          storageQuotaMb: 512,
          wasm: true,
          webGpu: false,
        }),
      ),
    });
    runtime.registerExecutor(executor(cloudDescriptor, { cloud: true }));

    await expect(runtime.execute(request({
      capability: 'heavy-reasoning',
      dataPlacement: 'can-use-cloud',
      requireOffline: true,
    }))).rejects.toBeInstanceOf(HybridRuntimeError);

    expect(runtime.offline.list()).toHaveLength(1);
  });

  it('manages local model lifecycle and rejects invalid checksums', () => {
    const runtime = new HybridRuntime();
    const downloaded = runtime.localModels.download({
      capability: 'local-llm',
      checksum: 'abc123',
      id: 'llm-small',
      sizeMb: 512,
      version: '1.0.0',
    });
    const verified = runtime.localModels.verify(downloaded.id, 'abc123');
    const loaded = runtime.localModels.load(verified.id);

    expect(loaded.status).toBe('loaded');
    expect(runtime.localModels.loadedFor('local-llm')?.id).toBe('llm-small');
    expect(() => runtime.localModels.verify(downloaded.id, 'bad')).toThrow(HybridRuntimeError);
  });

  it('merges sync records with version vectors and deterministic conflict resolution', () => {
    const sync = new SyncEngine();
    const left = sync.write({ deviceId: 'desktop', id: 'pref-theme', value: 'dark' });
    const right = sync.write({ deviceId: 'laptop', id: 'pref-theme', value: 'light' });
    const merged = sync.merge(left, right);

    expect(Object.keys(merged.vector)).toContain('desktop');
    expect(Object.keys(merged.vector)).toContain('laptop');
    expect(sync.get('pref-theme')?.id).toBe('pref-theme');
  });

  it('detects resource throttling from memory and battery budgets', () => {
    const resources = new ResourceManager();
    resources.setBudget({
      aiCostScore: 1,
      batteryAware: true,
      cpuPercent: 50,
      gpuPercent: 50,
      memoryMb: 256,
    });

    expect(resources.shouldThrottle({
      availableLocalModels: [],
      batteryLevel: 0.1,
      browserApis: [],
      charging: false,
      cpuCores: 2,
      gpuAvailable: false,
      hardwareAcceleration: false,
      network: 'good',
      ramMb: 1_024,
      storageQuotaMb: 128,
      wasm: true,
      webGpu: false,
    }, 512)).toBe(true);
  });
});

const localDescriptor: RuntimeDescriptor = {
  capabilities: ['local-embedding', 'local-llm', 'offline-search'],
  costScore: 0,
  health: 'healthy',
  latencyMs: 50,
  maxMemoryMb: 1_024,
  privacyScore: 1,
  supportsOffline: true,
  target: 'local',
};

const edgeDescriptor: RuntimeDescriptor = {
  capabilities: ['heavy-reasoning', 'workflow-execution'],
  costScore: 0.3,
  health: 'healthy',
  latencyMs: 120,
  maxMemoryMb: 2_048,
  privacyScore: 0.7,
  region: 'us',
  supportsOffline: false,
  target: 'edge',
};

const cloudDescriptor: RuntimeDescriptor = {
  capabilities: ['heavy-reasoning', 'document-indexing', 'agent-execution'],
  costScore: 0.8,
  health: 'healthy',
  latencyMs: 500,
  maxMemoryMb: 16_384,
  privacyScore: 0.3,
  region: 'us',
  supportsOffline: false,
  target: 'cloud',
};

function executor(descriptor: RuntimeDescriptor, output: ExecutionRequest['input']): RuntimeExecutor {
  return {
    descriptor,
    execute: () => output,
  };
}

function request(input: {
  readonly capability: ExecutionRequest['capability'];
  readonly dataPlacement: ExecutionRequest['policy']['dataPlacement'];
  readonly preferLocal?: boolean;
  readonly requireOffline?: boolean;
}): ExecutionRequest {
  return {
    capability: input.capability,
    id: crypto.randomUUID(),
    input: { payload: true },
    policy: {
      allowedTargets: ['local', 'edge', 'cloud', 'extension-service-worker', 'offscreen-document'],
      dataPlacement: input.dataPlacement,
      maxCostScore: 1,
      maxLatencyMs: 1_000,
      preferLocal: input.preferLocal ?? false,
      requireOffline: input.requireOffline ?? false,
    },
    priority: 'normal',
  };
}
