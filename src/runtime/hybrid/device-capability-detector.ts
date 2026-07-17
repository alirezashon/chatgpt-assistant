import type { DeviceCapabilityProfile } from './hybrid-types';

/** Device capability detector abstraction for browser, extension, and test runtimes. */
export class DeviceCapabilityDetector {
  public constructor(private readonly profile: DeviceCapabilityProfile = defaultProfile()) {}

  /** Returns current device profile. */
  public detect(): DeviceCapabilityProfile {
    return this.profile;
  }
}

function defaultProfile(): DeviceCapabilityProfile {
  return {
    availableLocalModels: [],
    batteryLevel: 1,
    browserApis: ['storage', 'offscreen', 'service-worker'],
    charging: true,
    cpuCores: 4,
    gpuAvailable: false,
    hardwareAcceleration: true,
    network: 'good',
    ramMb: 8_192,
    storageQuotaMb: 1_024,
    wasm: true,
    webGpu: false,
  };
}
