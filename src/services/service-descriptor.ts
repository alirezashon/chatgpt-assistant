import type { ServiceDescriptor, ServiceName } from '@/shared/types';

export function createServiceDescriptor<Name extends ServiceName>(
  name: Name,
): ServiceDescriptor<Name> {
  return Object.freeze({
    name,
  });
}
