import type { ProviderCapabilityKey } from '@/platform/providers/provider-types';

export function createProviderId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createProviderTimestamp(): string {
  return new Date().toISOString();
}

export function hasProviderCapability(
  capabilities: readonly ProviderCapabilityKey[],
  capability: ProviderCapabilityKey,
): boolean {
  return capabilities.includes(capability);
}

export function normalizeProviderText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}
