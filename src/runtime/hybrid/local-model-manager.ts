import type { LocalModelRecord, RuntimeCapability } from './hybrid-types';
import { HybridRuntimeError } from './hybrid-types';

/** Local AI model lifecycle: download, verify, cache, load, unload, update, fallback. */
export class LocalModelManager {
  private readonly models = new Map<string, LocalModelRecord>();

  /** Downloads/caches a model record. */
  public download(input: {
    readonly capability: RuntimeCapability;
    readonly checksum: string;
    readonly id: string;
    readonly sizeMb: number;
    readonly version: string;
  }): LocalModelRecord {
    const record: LocalModelRecord = {
      capability: input.capability,
      checksum: input.checksum,
      id: input.id,
      sizeMb: input.sizeMb,
      status: 'downloaded',
      version: input.version,
    };
    this.models.set(record.id, record);
    return record;
  }

  /** Verifies model integrity. */
  public verify(modelId: string, checksum: string): LocalModelRecord {
    const model = this.require(modelId);

    if (model.checksum !== checksum) {
      throw new HybridRuntimeError('HYBRID_MODEL_INVALID', 'Local model checksum verification failed.', { modelId });
    }

    return this.update(model, { status: 'verified' });
  }

  /** Loads model. */
  public load(modelId: string): LocalModelRecord {
    const model = this.require(modelId);

    if (model.status !== 'verified' && model.status !== 'cached' && model.status !== 'loaded') {
      throw new HybridRuntimeError('HYBRID_MODEL_INVALID', 'Model must be verified before loading.', { modelId });
    }

    return this.update(model, { loadedAt: Date.now(), status: 'loaded' });
  }

  /** Unloads model. */
  public unload(modelId: string): LocalModelRecord {
    const model = this.require(modelId);
    return {
      capability: model.capability,
      checksum: model.checksum,
      id: model.id,
      sizeMb: model.sizeMb,
      status: 'cached',
      version: model.version,
    };
  }

  /** Updates model version. */
  public updateVersion(modelId: string, version: string, checksum: string): LocalModelRecord {
    const model = this.require(modelId);
    return this.update(model, { checksum, status: 'downloaded', version });
  }

  /** Returns loaded model for capability. */
  public loadedFor(capability: RuntimeCapability): LocalModelRecord | undefined {
    return [...this.models.values()].find((model) => model.capability === capability && model.status === 'loaded');
  }

  /** Lists models. */
  public list(): readonly LocalModelRecord[] {
    return [...this.models.values()];
  }

  private require(modelId: string): LocalModelRecord {
    const model = this.models.get(modelId);

    if (model === undefined) {
      throw new HybridRuntimeError('HYBRID_MODEL_INVALID', `Local model not found: ${modelId}`);
    }

    return model;
  }

  private update(
    model: LocalModelRecord,
    patch: Partial<Pick<LocalModelRecord, 'checksum' | 'loadedAt' | 'status' | 'version'>>,
  ): LocalModelRecord {
    const next: LocalModelRecord = {
      ...model,
      ...(patch.checksum === undefined ? {} : { checksum: patch.checksum }),
      ...(patch.loadedAt === undefined ? {} : { loadedAt: patch.loadedAt }),
      ...(patch.status === undefined ? {} : { status: patch.status }),
      ...(patch.version === undefined ? {} : { version: patch.version }),
    };
    this.models.set(next.id, next);
    return next;
  }
}
