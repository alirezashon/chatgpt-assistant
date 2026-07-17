import { describe, expect, it } from 'vitest';

import { DIContainer } from './container';
import { createServiceToken } from './service-token';

describe('DIContainer', () => {
  it('resolves singleton services once', async () => {
    const container = new DIContainer();
    const token = createServiceToken<{ readonly id: number }>('test.singleton');
    let created = 0;

    container.register({
      factory: () => {
        created += 1;
        return { id: created };
      },
      lifetime: 'singleton',
      token,
    });

    await expect(container.resolve(token)).resolves.toEqual({ id: 1 });
    await expect(container.resolve(token)).resolves.toEqual({ id: 1 });
    expect(created).toBe(1);
  });

  it('detects circular dependencies at resolution time', async () => {
    const container = new DIContainer();
    const left = createServiceToken<unknown>('test.left');
    const right = createServiceToken<unknown>('test.right');

    container.register({
      dependencies: [right],
      factory: async (resolver) => resolver.resolve(right),
      lifetime: 'transient',
      token: left,
    });
    container.register({
      dependencies: [left],
      factory: async (resolver) => resolver.resolve(left),
      lifetime: 'transient',
      token: right,
    });

    await expect(container.resolve(left)).rejects.toThrow('Circular dependency detected');
  });
});
