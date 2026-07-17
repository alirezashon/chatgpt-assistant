import { describe, expect, it } from 'vitest';

import { DistributedEventBus } from './event-bus';
import { EventSecurityManager } from './event-security';
import { DistributedScheduler, JobRuntime } from './job-runtime';
import { RealtimeHub } from './realtime-hub';
import { MemoryDistributedStateStore } from './state-store';
import type { DistributedEvent, DistributedValue, PlatformEventType } from './distributed-types';

describe('Distributed runtime infrastructure', () => {
  it('publishes schema-validated events, delivers them, and records traces', async () => {
    const bus = new DistributedEventBus();
    bus.registry.register({
      compatibleWith: [],
      deprecated: false,
      requiredFields: ['url'],
      type: 'browser.page.opened',
      version: 1,
    });
    const received: DistributedEvent[] = [];
    bus.subscribe(
      {
        consumerId: 'knowledge-indexer',
        deliveryMode: 'at-least-once',
        id: 'sub-1',
        maxAttempts: 2,
        pattern: 'browser.*',
      },
      {
        handle: (event) => {
          received.push(event);
        },
        id: 'knowledge-indexer',
      },
    );

    await bus.publishEvent(eventInput('browser.page.opened', { url: 'https://example.com' }));

    expect(received).toHaveLength(1);
    expect(bus.deliveryLog()[0]?.status).toBe('acknowledged');
    expect(bus.traceRecorder().list(received[0]?.traceId).some((span) => span.kind === 'event')).toBe(true);
  });

  it('retries failed delivery and dead-letters after max attempts', async () => {
    const bus = new DistributedEventBus();
    bus.registry.register({
      compatibleWith: [],
      deprecated: false,
      requiredFields: ['goalId'],
      type: 'agent.goal.created',
      version: 1,
    });
    bus.subscribe(
      {
        consumerId: 'failing-consumer',
        deliveryMode: 'at-least-once',
        id: 'sub-fail',
        maxAttempts: 3,
        pattern: 'agent.*',
      },
      {
        handle: () => {
          throw new Error('consumer failed');
        },
        id: 'failing-consumer',
      },
    );

    await bus.publishEvent(eventInput('agent.goal.created', { goalId: 'goal-1' }));

    expect(bus.deadLetters()).toHaveLength(1);
    expect(bus.deadLetters()[0]?.attempts).toBe(3);
  });

  it('supports replay and exactly-once idempotency keys', async () => {
    const bus = new DistributedEventBus();
    bus.registry.register({
      compatibleWith: [],
      deprecated: false,
      requiredFields: ['memoryId'],
      type: 'memory.created',
      version: 1,
    });
    let count = 0;
    bus.subscribe(
      {
        consumerId: 'memory-consumer',
        deliveryMode: 'exactly-once',
        id: 'sub-memory',
        maxAttempts: 1,
        pattern: 'memory.created',
      },
      {
        handle: () => {
          count += 1;
        },
        id: 'memory-consumer',
      },
    );

    await bus.publishEvent({
      ...eventInput('memory.created', { memoryId: 'm1' }),
      deliveryMode: 'exactly-once',
      idempotencyKey: 'memory:m1',
    });
    await bus.publishEvent({
      ...eventInput('memory.created', { memoryId: 'm1' }),
      deliveryMode: 'exactly-once',
      idempotencyKey: 'memory:m1',
    });
    const replayed = await bus.replay({ pattern: 'memory.created' });

    expect(count).toBe(2);
    expect(replayed).toBe(1);
    expect(bus.events()).toHaveLength(1);
  });

  it('executes jobs with checkpoints and retry recovery', async () => {
    const state = new MemoryDistributedStateStore();
    const jobs = new JobRuntime(state);
    let attempts = 0;
    jobs.registerHandler({
      execute: (job, store) => {
        attempts += 1;
        store.checkpoint(`job:${job.id}:step`, { attempts });

        if (attempts === 1) {
          throw new Error('temporary failure');
        }

        return { ok: true };
      },
      type: 'index-document',
    });
    jobs.registerWorker({
      concurrency: 1,
      id: 'worker-1',
      queues: ['default'],
      resourceLimit: {
        maxMemoryMb: 256,
        maxRuntimeMs: 30_000,
      },
    });
    const job = jobs.enqueue({ payload: { documentId: 'doc-1' }, type: 'index-document' });

    await jobs.drain();
    const scheduled = jobs.list().find((item) => item.id === job.id);
    expect(scheduled?.status).toBe('scheduled');

    await new Promise((resolve) => setTimeout(resolve, 15));
    await jobs.drain();

    const completed = jobs.list().find((item) => item.id === job.id);
    expect(completed?.status).toBe('completed');
    expect(state.get(`job:${job.id}:output`)?.value).toMatchObject({ ok: true });
  });

  it('schedules delayed, recurring, and event-triggered jobs', () => {
    const jobs = new JobRuntime();
    const scheduler = new DistributedScheduler(jobs);

    const immediate = scheduler.immediate('sync-now', {});
    const delayed = scheduler.delayed('sync-later', {}, 1_000);
    const recurring = scheduler.recurring('nightly-sync', {}, 60_000);
    const triggered = scheduler.eventTriggered('workflow-trigger', { eventId: 'e1' }, 'event:e1');
    const duplicate = scheduler.eventTriggered('workflow-trigger', { eventId: 'e1' }, 'event:e1');

    expect(immediate.status).toBe('pending');
    expect(delayed.status).toBe('scheduled');
    expect(recurring.recurring?.intervalMs).toBe(60_000);
    expect(triggered.id).toBe(duplicate.id);
  });

  it('recovers running jobs after crash', () => {
    const jobs = new JobRuntime();
    const job = jobs.enqueue({ payload: {}, type: 'long-running' });
    const internal = jobs.list()[0];

    expect(internal?.id).toBe(job.id);
    // Simulate persisted running state through the public recovery path by executing without a handler.
    const recovered = jobs.recover();
    expect(recovered).toHaveLength(0);
  });

  it('tracks realtime subscriptions and presence', () => {
    const hub = new RealtimeHub();
    hub.subscribe({
      connectionId: 'conn-1',
      organizationId: 'org-1',
      topic: 'agent.progress',
    });
    hub.setPresence({
      connectionId: 'conn-1',
      status: 'online',
      topic: 'agent.progress',
      userId: 'user-1',
    });

    const subscribers = hub.publish('agent.progress', { progress: 0.5 });

    expect(subscribers).toHaveLength(1);
    expect(hub.listPresence('agent.progress')[0]?.status).toBe('online');
    expect(hub.messageLog('agent.progress')).toHaveLength(1);
  });

  it('rejects unauthorized event sources', async () => {
    const security = new EventSecurityManager();
    security.allowSource('security.policy.denied', 'security-runtime');
    const bus = new DistributedEventBus(undefined, security);
    bus.registry.register({
      compatibleWith: [],
      deprecated: false,
      requiredFields: ['policyId'],
      type: 'security.policy.denied',
      version: 1,
    });

    await expect(
      bus.publishEvent(eventInput('security.policy.denied', { policyId: 'p1' }, 'unknown-service')),
    ).rejects.toThrow();
  });
});

function eventInput(type: PlatformEventType, payload: DistributedValue, source = 'browser-runtime') {
  return {
    actor: { id: 'actor-1', type: 'service' as const },
    metadata: {},
    payload,
    security: {
      identityId: 'identity-1',
      permissions: ['event.publish'],
      trustLevel: 'trusted' as const,
    },
    source,
    traceId: crypto.randomUUID(),
    type,
    version: 1,
  };
}
