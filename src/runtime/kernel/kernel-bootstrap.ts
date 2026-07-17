import { KernelBuilder } from './kernel-builder';
import type { KernelMetadata } from './kernel-types';

/** Creates the default extension kernel builder. */
export function createKernelBuilder(metadata: KernelMetadata): KernelBuilder {
  return new KernelBuilder(metadata);
}
