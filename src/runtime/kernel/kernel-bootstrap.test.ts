import { describe, expect, it } from 'vitest';

import { createFakeModule } from '@/runtime/testing';

import { createKernelBuilder } from './kernel-bootstrap';

describe('Kernel bootstrap', () => {
  it('boots and shuts down modules through lifecycle states', async () => {
    const { calls, module } = createFakeModule();
    const kernel = createKernelBuilder({
      id: 'test.kernel',
      name: 'Test Kernel',
      version: { major: 1, minor: 0, patch: 0 },
    })
      .addModule(module)
      .build();

    await kernel.boot();

    expect(kernel.state).toBe('booted');
    expect(calls).toEqual(['initialize', 'enable']);

    await kernel.shutdown();

    expect(kernel.state).toBe('shutdown');
    expect(calls).toEqual(['initialize', 'enable', 'dispose']);
  });
});
