import { describe, expect, it } from 'vitest';

import { MemoryStorageDriver } from '@/runtime/storage';

import { DriverMemoryStore } from './memory-store';
import { MemoryRuntime } from './memory-runtime';
import type { MemoryObservation, MemorySource } from './memory-types';

const source: MemorySource = {
  id: 'user',
  timestamp: 1_000,
  trust: 1,
  type: 'explicit-user',
};

describe('MemoryRuntime', () => {
  it('extracts explicit preferences and retrieves them semantically', async () => {
    const runtime = new MemoryRuntime();
    const [memory] = await runtime.observe(observation('I always use TypeScript for APIs.', true));

    expect(memory?.type).toBe('preference');
    expect(memory?.approval).toBe('approved');

    const results = await runtime.retrieve({
      limit: 5,
      permissions: ['memory.read', 'memory.apply'],
      text: 'Create API',
      types: ['preference', 'semantic'],
    });

    expect(results[0]?.item.id).toBe(memory?.id);
    expect(results[0]?.score).toBeGreaterThan(0);
  });

  it('keeps implicit memories pending until approval', async () => {
    const runtime = new MemoryRuntime();
    const [memory] = await runtime.observe(observation('User usually deploys with Docker.', false));

    expect(memory?.approval).toBe('pending');
    expect(
      await runtime.retrieve({ limit: 5, permissions: ['memory.read'], text: 'deploy docker' }),
    ).toHaveLength(0);

    await runtime.approve(memory?.id ?? '');
    const results = await runtime.retrieve({
      limit: 5,
      permissions: ['memory.read', 'memory.apply'],
      text: 'deploy docker',
    });

    expect(results).toHaveLength(1);
  });

  it('rejects sensitive observations by privacy policy', async () => {
    const runtime = new MemoryRuntime();
    const memories = await runtime.observe(
      observation('My password is hunter2.', true, 'restricted'),
    );

    expect(memories).toHaveLength(0);
    expect(await runtime.list()).toHaveLength(0);
  });

  it('stores relationships and contradiction edges in the knowledge graph', async () => {
    const runtime = new MemoryRuntime();
    const [react] = await runtime.observe(observation('I prefer React for frontend work.', true));
    const [vue] = await runtime.observe(observation('I prefer Vue for frontend work.', true));
    const graph = await runtime.graphSnapshot();
    const updatedReact = (await runtime.list()).find((item) => item.id === react?.id);

    expect(react?.id).toBeDefined();
    expect(vue?.id).toBeDefined();
    expect(graph.nodes.map((node) => node.id)).toContain(vue?.id);
    expect(graph.relationships.some((relationship) => relationship.type === 'conflicts_with')).toBe(
      true,
    );
    expect(updatedReact?.confidence.contradictionPenalty).toBeGreaterThan(0);
  });

  it('forgets by type, deletes individual memories, and cleans up expiration', async () => {
    const runtime = new MemoryRuntime();
    const preference = await runtime.remember({
      content: 'User prefers concise answers.',
      source,
      title: 'Concise answers',
      type: 'preference',
    });
    const [working] = await runtime.observe(
      observation('Current task is drafting a README.', true, 'public', 1_000),
      1_000,
    );

    await runtime.delete(preference.id);
    expect((await runtime.list()).map((item) => item.id)).not.toContain(preference.id);

    const deletedExpired = await runtime.cleanupExpired(1_000 + 2 * 60 * 60 * 1000);
    expect(deletedExpired).toBe(1);
    expect((await runtime.list()).map((item) => item.id)).not.toContain(working?.id);

    await runtime.remember({
      content: 'User uses Docker.',
      source,
      title: 'Docker',
      type: 'procedural',
    });
    expect(await runtime.forgetType('procedural')).toBe(1);
  });

  it('persists memories through storage-backed store', async () => {
    const driver = new MemoryStorageDriver();
    const first = new MemoryRuntime({
      store: new DriverMemoryStore(driver),
    });
    const item = await first.remember({
      content: 'User works on the Atlas repository.',
      source,
      tags: ['github'],
      title: 'Atlas repository',
      type: 'semantic',
    });
    const second = new MemoryRuntime({
      store: new DriverMemoryStore(driver),
    });

    expect((await second.list()).map((memory) => memory.id)).toContain(item.id);
  });
});

function observation(
  text: string,
  userConfirmed: boolean,
  sensitivity: MemoryObservation['sensitivity'] = 'personal',
  timestamp = 1_000,
): MemoryObservation {
  return {
    context: { text },
    id: crypto.randomUUID(),
    sensitivity,
    source: {
      ...source,
      timestamp,
    },
    taskSuccess: true,
    text,
    userConfirmed,
  };
}
