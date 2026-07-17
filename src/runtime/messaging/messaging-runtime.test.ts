import { describe, expect, it } from 'vitest';

import { createConnectedTransports } from '@/runtime/testing';

import { MessagingRuntime } from './messaging-runtime';
import type { MessageContractMap } from './messaging-types';

interface TestMessages extends MessageContractMap {
  readonly ping: {
    readonly request: { readonly value: string };
    readonly response: { readonly pong: string };
  };
}

describe('MessagingRuntime', () => {
  it('sends typed requests over a transport', async () => {
    const { left, right } = createConnectedTransports();
    const client = new MessagingRuntime<TestMessages>('client', left);
    const server = new MessagingRuntime<TestMessages>('server', right);

    server.handle('ping', (payload) => ({ pong: payload.value }));

    await expect(client.request('ping', { value: 'ok' })).resolves.toEqual({ pong: 'ok' });
  });
});
