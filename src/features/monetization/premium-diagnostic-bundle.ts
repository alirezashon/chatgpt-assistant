import type { LocalDiagnosticBundle } from '@/features/diagnostics';
import type { LocalUsageAnalytics } from '@/features/monetization/local-usage-analytics';

export interface PremiumDiagnosticBundleSummary {
  readonly diagnosticCount: number;
  readonly healthScore: number;
  readonly priority: 'high' | 'normal';
  readonly supportMessage: string;
}

export function createPremiumDiagnosticBundleSummary(input: {
  readonly diagnostics: LocalDiagnosticBundle;
  readonly usage: LocalUsageAnalytics;
}): PremiumDiagnosticBundleSummary {
  const diagnosticCount = input.diagnostics.reports.length;
  const priority = diagnosticCount > 0 || input.usage.workspaceHealthScore < 70 ? 'high' : 'normal';

  return {
    diagnosticCount,
    healthScore: input.usage.workspaceHealthScore,
    priority,
    supportMessage:
      priority === 'high'
        ? 'Attach this bundle for priority support so setup, health, and local errors can be reviewed faster.'
        : 'This bundle is ready for proactive Pro support if the user wants a workspace health review.',
  };
}
