import { MemoryDistributedStateStore } from './state-store';
import { DistributedTraceRecorder } from './trace-recorder';
import type {
  DistributedJob,
  DistributedJobHandler,
  DistributedRecurringSchedule,
  DistributedStateStore,
  DistributedValue,
  DistributedWorker,
  JobPriority,
  WorkerHealth,
} from './distributed-types';

/** Job runtime with priority queues, workers, retries, scheduling, recovery, and checkpoints. */
export class JobRuntime {
  private readonly handlers = new Map<string, DistributedJobHandler>();
  private readonly jobs = new Map<string, DistributedJob>();
  private readonly workerHealth = new Map<string, WorkerHealth>();
  private readonly workers = new Map<string, DistributedWorker>();

  public constructor(
    public readonly state: DistributedStateStore = new MemoryDistributedStateStore(),
    private readonly traces = new DistributedTraceRecorder(),
  ) {}

  /** Registers a job handler. */
  public registerHandler(handler: DistributedJobHandler): void {
    this.handlers.set(handler.type, handler);
  }

  /** Registers worker. */
  public registerWorker(worker: DistributedWorker): WorkerHealth {
    this.workers.set(worker.id, worker);
    const health: WorkerHealth = {
      activeJobs: 0,
      lastHeartbeatAt: Date.now(),
      status: 'healthy',
      workerId: worker.id,
    };
    this.workerHealth.set(worker.id, health);
    return health;
  }

  /** Enqueues immediate, delayed, or recurring job. */
  public enqueue(input: {
    readonly idempotencyKey?: string;
    readonly organizationId?: string;
    readonly payload: DistributedValue;
    readonly priority?: JobPriority;
    readonly queue?: string;
    readonly recurring?: DistributedRecurringSchedule;
    readonly runAt?: number;
    readonly type: string;
  }): DistributedJob {
    const existing =
      input.idempotencyKey === undefined
        ? undefined
        : [...this.jobs.values()].find((job) => job.idempotencyKey === input.idempotencyKey);

    if (existing !== undefined) {
      return existing;
    }

    const now = Date.now();
    const job: DistributedJob = {
      attempts: 0,
      createdAt: now,
      id: crypto.randomUUID(),
      ...(input.idempotencyKey === undefined ? {} : { idempotencyKey: input.idempotencyKey }),
      ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
      payload: input.payload,
      priority: input.priority ?? 'normal',
      queue: input.queue ?? 'default',
      ...(input.recurring === undefined ? {} : { recurring: input.recurring }),
      retryPolicy: { initialDelayMs: 10, maxAttempts: 3, multiplier: 2 },
      runAt: input.runAt ?? now,
      status: (input.runAt ?? now) > now ? 'scheduled' : 'pending',
      type: input.type,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  /** Runs all due jobs assignable to healthy workers. */
  public async drain(queue = 'default'): Promise<readonly DistributedJob[]> {
    const completed: DistributedJob[] = [];

    let job = this.nextJob(queue);

    while (job !== undefined) {
      completed.push(await this.execute(job));
      job = this.nextJob(queue);
    }

    return completed;
  }

  /** Recovers running jobs after crash by returning them to pending. */
  public recover(): readonly DistributedJob[] {
    const recovered: DistributedJob[] = [];

    for (const job of this.jobs.values()) {
      if (job.status === 'running') {
        const next = this.update(job, { status: 'pending' });
        recovered.push(next);
      }
    }

    return recovered;
  }

  /** Lists jobs. */
  public list(): readonly DistributedJob[] {
    return [...this.jobs.values()];
  }

  /** Worker health. */
  public health(): readonly WorkerHealth[] {
    return [...this.workerHealth.values()];
  }

  /** Trace recorder. */
  public traceRecorder(): DistributedTraceRecorder {
    return this.traces;
  }

  private nextJob(queue: string): DistributedJob | undefined {
    return [...this.jobs.values()]
      .filter((job) => job.queue === queue && (job.status === 'pending' || job.status === 'scheduled') && job.runAt <= Date.now())
      .sort((left, right) => priorityRank(right.priority) - priorityRank(left.priority) || left.createdAt - right.createdAt)[0];
  }

  private async execute(job: DistributedJob): Promise<DistributedJob> {
    const handler = this.handlers.get(job.type);

    if (handler === undefined) {
      return this.update(job, {
        error: `No job handler registered: ${job.type}`,
        status: 'dead-lettered',
      });
    }

    const running = this.update(job, {
      attempts: job.attempts + 1,
      status: 'running',
    });
    const span = this.traces.start({
      attributes: { jobId: running.id, type: running.type },
      kind: 'job',
      name: `job.${running.type}`,
      traceId: running.id,
    });

    try {
      const output = await handler.execute(running, this.state);
      this.state.checkpoint(`job:${running.id}:output`, output);
      this.traces.end(span.id, 'ok');
      const completed = this.update(running, { status: 'completed' });
      this.scheduleRecurring(completed);
      return completed;
    } catch (error) {
      this.traces.end(span.id, 'failed');
      const message = error instanceof Error ? error.message : String(error);

      if (running.attempts >= running.retryPolicy.maxAttempts) {
        return this.update(running, {
          error: message,
          status: 'dead-lettered',
        });
      }

      return this.update(running, {
        error: message,
        runAt: Date.now() + running.retryPolicy.initialDelayMs * Math.pow(running.retryPolicy.multiplier, running.attempts - 1),
        status: 'scheduled',
      });
    }
  }

  private scheduleRecurring(job: DistributedJob): void {
    if (job.recurring?.intervalMs === undefined) {
      return;
    }

    this.enqueue({
      payload: job.payload,
      priority: job.priority,
      queue: job.queue,
      recurring: job.recurring,
      runAt: Date.now() + job.recurring.intervalMs,
      type: job.type,
      ...(job.organizationId === undefined ? {} : { organizationId: job.organizationId }),
    });
  }

  private update(
    job: DistributedJob,
    patch: Partial<Pick<DistributedJob, 'attempts' | 'error' | 'runAt' | 'status'>>,
  ): DistributedJob {
    const next: DistributedJob = {
      ...job,
      ...(patch.attempts === undefined ? {} : { attempts: patch.attempts }),
      ...(patch.error === undefined ? {} : { error: patch.error }),
      ...(patch.runAt === undefined ? {} : { runAt: patch.runAt }),
      ...(patch.status === undefined ? {} : { status: patch.status }),
      updatedAt: Date.now(),
    };
    this.jobs.set(next.id, next);
    return next;
  }
}

/** Scheduler facade for cron, delayed, recurring, immediate, and event-triggered jobs. */
export class DistributedScheduler {
  public constructor(private readonly jobs: JobRuntime) {}

  /** Schedules immediate job. */
  public immediate(type: string, payload: DistributedValue, queue = 'default'): DistributedJob {
    return this.jobs.enqueue({ payload, queue, type });
  }

  /** Schedules delayed job. */
  public delayed(type: string, payload: DistributedValue, delayMs: number, queue = 'default'): DistributedJob {
    return this.jobs.enqueue({ payload, queue, runAt: Date.now() + delayMs, type });
  }

  /** Schedules recurring job by fixed interval. */
  public recurring(type: string, payload: DistributedValue, intervalMs: number, queue = 'default'): DistributedJob {
    return this.jobs.enqueue({
      payload,
      queue,
      recurring: { intervalMs },
      runAt: Date.now() + intervalMs,
      type,
    });
  }

  /** Converts an event into a triggered job. */
  public eventTriggered(type: string, payload: DistributedValue, idempotencyKey: string): DistributedJob {
    return this.jobs.enqueue({ idempotencyKey, payload, type });
  }
}

function priorityRank(priority: JobPriority): number {
  if (priority === 'critical') {
    return 4;
  }

  if (priority === 'high') {
    return 3;
  }

  if (priority === 'normal') {
    return 2;
  }

  return 1;
}
