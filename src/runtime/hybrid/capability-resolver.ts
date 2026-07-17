import type { DeviceCapabilityProfile, RuntimeCapability, RuntimeDescriptor } from './hybrid-types';

/** Resolves which runtime targets can satisfy requested capabilities under current device profile. */
export class CapabilityResolver {
  /** Filters runtimes by capability and device constraints. */
  public resolve(
    capability: RuntimeCapability,
    runtimes: readonly RuntimeDescriptor[],
    device: DeviceCapabilityProfile,
  ): readonly RuntimeDescriptor[] {
    return runtimes
      .filter((runtime) => runtime.health === 'healthy' || runtime.health === 'degraded')
      .filter((runtime) => runtime.capabilities.includes(capability))
      .filter((runtime) => runtime.target !== 'local' || localReady(capability, device))
      .filter((runtime) => runtime.target !== 'edge' || device.network !== 'offline')
      .filter((runtime) => runtime.target !== 'cloud' || device.network !== 'offline');
  }
}

function localReady(capability: RuntimeCapability, device: DeviceCapabilityProfile): boolean {
  if (capability === 'gpu-compute') {
    return device.gpuAvailable && device.webGpu;
  }

  if (['local-embedding', 'local-llm', 'local-ocr', 'local-speech', 'local-vision'].includes(capability)) {
    return device.availableLocalModels.length > 0 && device.ramMb >= 2_048;
  }

  return true;
}
