import { describe, expect, it } from 'vitest';

import { createAIJobControlState } from '@/features/ai/ai-job-controls';
import type { AIJob } from '@/features/ai/ai-types';

describe('AI job controls', () => {
  it('exposes cancellation for running jobs', () => {
    expect(createAIJobControlState(createJob({ status: 'running' }))).toMatchObject({
      canCancel: true,
      canRetry: false,
      primaryAction: 'cancel',
    });
  });

  it('prioritizes rate-limit wait messaging over retry', () => {
    expect(
      createAIJobControlState(createJob({ attempts: 1, status: 'failed' }), {
        limitedUntil: '2026-07-10T00:01:00.000Z',
        remainingRequests: 0,
      }),
    ).toMatchObject({
      canRetry: true,
      isRateLimited: true,
      primaryAction: 'wait',
    });
  });
});

function createJob(overrides: Partial<AIJob>): AIJob {
  const now = '2026-07-10T00:00:00.000Z';

  return {
    attempts: 0,
    createdAt: now,
    id: 'ai-job-1',
    maxRetries: 2,
    priority: 'normal',
    progress: 0,
    request: {
      context: {
        preferences: {
          enableDebugLogging: false,
          schemaVersion: 1,
          sidebarWidth: 380,
          theme: 'system',
        },
        recentActivity: [],
        workspace: {} as AIJob['request']['context']['workspace'],
      },
      createdAt: now,
      id: 'ai-task-1',
      input: 'Summarize',
      metadata: {},
      type: 'conversation-summarization',
    },
    runtimeTarget: 'background-worker',
    status: 'queued',
    updatedAt: now,
    ...overrides,
  };
}
