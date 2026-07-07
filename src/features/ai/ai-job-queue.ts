import type { AIConfig } from '@/features/ai/ai-config';
import type { AIJob } from '@/features/ai/ai-types';
import { compareAIJobPriority, createAITimestamp } from '@/features/ai/ai-utils';

export type AIJobRunner = (job: AIJob, signal: AbortSignal) => Promise<AIJob>;
export type AIJobUpdateHandler = (job: AIJob) => void;

interface RunningJob {
  readonly controller: AbortController;
  readonly job: AIJob;
}

export class AIJobQueue {
  private readonly config: AIConfig;
  private readonly onUpdate: AIJobUpdateHandler;
  private readonly pending: AIJob[] = [];
  private readonly running = new Map<string, RunningJob>();

  public constructor(config: AIConfig, onUpdate: AIJobUpdateHandler) {
    this.config = config;
    this.onUpdate = onUpdate;
  }

  public enqueue(job: AIJob, runner: AIJobRunner): void {
    this.pending.push(job);
    this.pending.sort((left, right) => compareAIJobPriority(left.priority, right.priority));
    this.onUpdate(job);
    this.pump(runner);
  }

  public cancel(jobId: string): boolean {
    const pendingIndex = this.pending.findIndex((job) => job.id === jobId);

    if (pendingIndex >= 0) {
      const [job] = this.pending.splice(pendingIndex, 1);

      if (job !== undefined) {
        this.onUpdate(markJob(job, 'cancelled', 0));
        return true;
      }
    }

    const running = this.running.get(jobId);

    if (running === undefined) {
      return false;
    }

    running.controller.abort();
    this.running.delete(jobId);
    this.onUpdate(markJob(running.job, 'cancelled', running.job.progress));

    return true;
  }

  private pump(runner: AIJobRunner): void {
    while (this.running.size < this.config.maxConcurrentJobs && this.pending.length > 0) {
      const job = this.pending.shift();

      if (job === undefined) {
        return;
      }

      this.start(job, runner);
    }
  }

  private start(job: AIJob, runner: AIJobRunner): void {
    const controller = new AbortController();
    const runningJob = markJob(job, 'running', 10);

    this.running.set(job.id, {
      controller,
      job: runningJob,
    });
    this.onUpdate(runningJob);

    void runner(runningJob, controller.signal)
      .then((updatedJob) => {
        this.running.delete(job.id);
        this.onUpdate(updatedJob);
        this.pump(runner);
      })
      .catch((error: unknown) => {
        this.running.delete(job.id);
        const failedJob = markJob(
          {
            ...runningJob,
            error: error instanceof Error ? error.message : 'AI job failed.',
          },
          'failed',
          runningJob.progress,
        );

        this.onUpdate(failedJob);
        this.pump(runner);
      });
  }
}

function markJob(job: AIJob, status: AIJob['status'], progress: number): AIJob {
  const now = createAITimestamp();
  const isCompletedStatus = status === 'cancelled' || status === 'failed' || status === 'succeeded';

  return {
    ...job,
    ...(isCompletedStatus ? { completedAt: now } : {}),
    progress,
    ...(status === 'running' ? { startedAt: now } : {}),
    status,
    updatedAt: now,
  };
}
