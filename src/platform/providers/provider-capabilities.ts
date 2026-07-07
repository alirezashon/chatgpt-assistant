import type {
  ProviderCapabilities,
  ProviderCapabilityKey,
} from '@/platform/providers/provider-types';

export function supportsCapability(
  capabilities: ProviderCapabilities,
  capability: ProviderCapabilityKey,
): boolean {
  return capabilities.supportedCapabilities.includes(capability);
}

export function createEmptyProviderCapabilities(): ProviderCapabilities {
  return {
    authStrategies: [],
    featureFlags: [],
    rateLimits: {},
    supportedAttachments: [],
    supportedCapabilities: [],
  };
}
