import { describe, expect, it } from 'vitest';

import { createLocalUsageAnalytics } from '@/features/monetization/local-usage-analytics';

describe('local usage analytics', () => {
  it('estimates saved time and workspace health from local counters', () => {
    expect(
      createLocalUsageAnalytics({
        aiCacheEntries: 3,
        assignmentCount: 8,
        conversationCount: 10,
        diagnosticCount: 0,
        folderCount: 2,
        tagCount: 4,
      }),
    ).toMatchObject({
      backupReady: true,
      estimatedSavedMinutes: 39,
      workspaceHealthScore: 91,
    });
  });
});
