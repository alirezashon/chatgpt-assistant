import type { AIConfig } from '@/features/ai/ai-config';
import type { AIEngine } from '@/features/ai/ai-engine';
import type { AIEvents } from '@/features/ai/ai-events';
import type { AIHistory } from '@/features/ai/ai-history';
import { AIJobQueue } from '@/features/ai/ai-job-queue';
import type { AIRepository } from '@/features/ai/ai-repository';
import type { AIJob, AIJobPriority, AIState, AITaskRequest } from '@/features/ai/ai-types';
import { createAIId, createAITimestamp } from '@/features/ai/ai-utils';
import type { Store } from '@/state';

export class AITaskManager {
  private readonly config: AIConfig;
  private readonly engine: AIEngine;
  private readonly events: AIEvents;
  private readonly history: AIHistory;
  private readonly queue: AIJobQueue;
  private readonly repository: AIRepository;
  private readonly store: Store<AIState>;

  public constructor(options: {
    readonly config: AIConfig;
    readonly engine: AIEngine;
    readonly events: AIEvents;
    readonly history: AIHistory;
    readonly repository: AIRepository;
    readonly store: Store<AIState>;
  }) {
    this.config = options.config;
    this.engine = options.engine;
    this.events = options.events;
    this.history = options.history;
    this.repository = options.repository;
    this.store = options.store;
    this.queue = new AIJobQueue(this.config, (job) => this.updateJob(job));
  }

  public enqueue(
    request: AITaskRequest,
    priority: AIJobPriority = this.config.defaultPriority,
  ): AIJob {
    const now = createAITimestamp();
    const job: AIJob = {
      attempts: 0,
      createdAt: now,
      id: createAIId('ai-job'),
      maxRetries: this.config.defaultMaxRetries,
      priority,
      progress: 0,
      request,
      runtimeTarget: this.store.getState().settings.jobRuntimeTarget,
      status: 'queued',
      updatedAt: now,
    };

    this.events.emit('aiJobQueued', {
      job,
    });
    this.queue.enqueue(job, (queuedJob, signal) => this.runJob(queuedJob, signal));

    return job;
  }

  public cancel(jobId: string): boolean {
    const cancelled = this.queue.cancel(jobId);

    if (cancelled) {
      this.events.emit('aiJobCancelled', {
        jobId,
      });
    }

    return cancelled;
  }

  private async runJob(job: AIJob, signal: AbortSignal): Promise<AIJob> {
    this.events.emit('aiJobStarted', {
      job,
    });

    try {
      const result = await this.engine.executeTask(
        job.request,
        this.store.getState().settings,
        signal,
      );
      const completedJob: AIJob = {
        ...job,
        attempts: job.attempts + 1,
        completedAt: createAITimestamp(),
        progress: 100,
        result,
        status: 'succeeded',
        updatedAt: createAITimestamp(),
      };

      await this.persistHistory(completedJob);
      await this.repository.saveCache(this.engine.cache.serialize());
      this.events.emit('aiJobCompleted', {
        job: completedJob,
        result,
      });

      return completedJob;
    } catch (error) {
      if (job.attempts < job.maxRetries && !signal.aborted) {
        const retryingJob: AIJob = {
          ...job,
          attempts: job.attempts + 1,
          error: error instanceof Error ? error.message : 'AI task failed.',
          status: 'retrying',
          updatedAt: createAITimestamp(),
        };

        this.events.emit('aiJobRetrying', {
          job: retryingJob,
        });

        return await this.runJob(retryingJob, signal);
      }

      const failedJob: AIJob = {
        ...job,
        attempts: job.attempts + 1,
        completedAt: createAITimestamp(),
        error: error instanceof Error ? error.message : 'AI task failed.',
        status: signal.aborted ? 'cancelled' : 'failed',
        updatedAt: createAITimestamp(),
      };

      await this.persistHistory(failedJob);
      this.events.emit('aiJobFailed', {
        error: error instanceof Error ? error : new Error('AI task failed.'),
        job: failedJob,
      });

      return failedJob;
    }
  }

  private updateJob(job: AIJob): void {
    const activeJobs = [
      job,
      ...this.store.getState().activeJobs.filter((currentJob) => currentJob.id !== job.id),
    ].slice(0, 25);

    this.store.setState({
      activeJobs,
      error: job.status === 'failed' ? new Error(job.error ?? 'AI job failed.') : null,
      status: job.status === 'running' || job.status === 'retrying' ? 'running' : 'ready',
    });
  }

  private async persistHistory(job: AIJob): Promise<void> {
    const history = this.history.record(job);

    this.store.setState({
      history,
    });
    await this.repository.saveHistory(history);
  }
}
