import type { ServiceToken } from './di-types';

/** Creates a stable typed service token. */
export function createServiceToken<Service>(
  id: string,
  description?: string,
): ServiceToken<Service> {
  return {
    id,
    ...(description === undefined ? {} : { description }),
  };
}
