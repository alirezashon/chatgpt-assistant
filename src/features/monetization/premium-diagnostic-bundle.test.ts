import { describe, expect, it } from 'vitest';

import type { LocalDiagnosticBundle } from '@/features/diagnostics';
import { createLocalUsageAnalytics } from '@/features/monetization/local-usage-analytics';
import { createPremiumDiagnosticBundleSummary } from '@/features/monetization/premium-diagnostic-bundle';

describe('premium diagnostic bundle', () => {
  it('marks bundles high priority when local errors exist', () => {
    const summary = createPremiumDiagnosticBundleSummary({
      diagnostics: createDiagnosticBundle(1),
      usage: createLocalUsageAnalytics({
        aiCacheEntries: 0,
        assignmentCount: 0,
        conversationCount: 0,
        diagnosticCount: 1,
        folderCount: 0,
        tagCount: 0,
      }),
    });

    expect(summary).toMatchObject({
      diagnosticCount: 1,
      priority: 'high',
    });
  });
});

function createDiagnosticBundle(reportCount: number): LocalDiagnosticBundle {
  return {
    appName: 'ChatGPT Workspace',
    appVersion: '0.1.0',
    exportedAt: '2026-07-10T00:00:00.000Z',
    kind: 'chatgpt-workspace.local-diagnostics',
    privacyNote: 'Review before sharing.',
    reports: Array.from({ length: reportCount }, (_, index) => ({
      appVersion: '0.1.0',
      id: `diag-${index.toString()}`,
      message: 'Failure',
      name: 'Error',
      surface: 'options',
      timestamp: '2026-07-10T00:00:00.000Z',
    })),
  };
}
