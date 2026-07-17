import { createServiceToken, type ServiceRegistration } from '@/runtime/di';
import type { RuntimeModule } from '@/runtime/modules';
import { MemoryMessageTransport } from '@/runtime/messaging';

/** Simple fake service used by runtime tests. */
export interface FakeService {
  /** Returns a deterministic test value. */
  value(): string;
}

/** Fake service token. */
export const FAKE_SERVICE_TOKEN = createServiceToken<FakeService>('test.fake-service');

/** Creates a fake singleton service registration. */
export function createFakeServiceRegistration(): ServiceRegistration<FakeService> {
  return {
    factory: () => ({
      value: () => 'fake',
    }),
    lifetime: 'singleton',
    token: FAKE_SERVICE_TOKEN,
  };
}

/** Creates a lifecycle-counting fake module. */
export function createFakeModule(id = 'test.fake-module') {
  const calls: string[] = [];
  const module: RuntimeModule = {
    dispose: () => {
      calls.push('dispose');
    },
    enable: () => {
      calls.push('enable');
    },
    health: () => ({ status: 'healthy' }),
    initialize: () => {
      calls.push('initialize');
    },
    metadata: {
      id,
      name: 'Fake Module',
      version: '1.0.0',
    },
  };

  return { calls, module };
}

/** Creates connected in-memory transports. */
export function createConnectedTransports() {
  const left = new MemoryMessageTransport();
  const right = new MemoryMessageTransport();
  left.peer = right;
  right.peer = left;
  return { left, right };
}
