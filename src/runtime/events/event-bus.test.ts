import { describe, expect, it } from 'vitest';

import { EventBus } from './event-bus';

interface TestEvents {
  readonly 'kernel.ready': { readonly value: string };
  readonly 'kernel.done': { readonly value: string };
}

describe('EventBus', () => {
  it('delivers events by priority and wildcard pattern', async () => {
    const bus = new EventBus<TestEvents>();
    const calls: string[] = [];

    bus.onPattern('kernel.*', () => {
      calls.push('wildcard');
    });
    bus.on('kernel.ready', () => {
      calls.push('low');
    });
    bus.on(
      'kernel.ready',
      () => {
        calls.push('high');
      },
      { priority: 10 },
    );

    await bus.emit('kernel.ready', { value: 'ok' });

    expect(calls).toEqual(['high', 'wildcard', 'low']);
    expect(bus.getMetrics().delivered).toBe(3);
  });

  it('supports one-time listeners', async () => {
    const bus = new EventBus<TestEvents>();
    let count = 0;

    bus.on(
      'kernel.ready',
      () => {
        count += 1;
      },
      { once: true },
    );

    await bus.emit('kernel.ready', { value: 'one' });
    await bus.emit('kernel.ready', { value: 'two' });

    expect(count).toBe(1);
  });
});
