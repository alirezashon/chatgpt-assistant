export interface LocalUsageAnalyticsInput {
  readonly aiCacheEntries: number;
  readonly assignmentCount: number;
  readonly conversationCount: number;
  readonly diagnosticCount: number;
  readonly folderCount: number;
  readonly tagCount: number;
}

export interface LocalUsageAnalytics {
  readonly backupReady: boolean;
  readonly estimatedSavedMinutes: number;
  readonly healthCounters: readonly LocalUsageHealthCounter[];
  readonly workspaceHealthScore: number;
}

export interface LocalUsageHealthCounter {
  readonly label: string;
  readonly status: 'attention' | 'good';
  readonly value: number;
}

export function createLocalUsageAnalytics(input: LocalUsageAnalyticsInput): LocalUsageAnalytics {
  const organizedConversations = Math.min(input.assignmentCount, input.conversationCount);
  const organizationCoverage =
    input.conversationCount === 0 ? 0 : organizedConversations / input.conversationCount;
  const hasStructure = input.folderCount > 0 || input.tagCount > 0;
  const diagnosticPenalty = Math.min(input.diagnosticCount * 5, 25);
  const workspaceHealthScore = clampScore(
    Math.round(35 + organizationCoverage * 45 + (hasStructure ? 20 : 0) - diagnosticPenalty),
  );

  return {
    backupReady: input.conversationCount > 0 || input.folderCount > 0 || input.assignmentCount > 0,
    estimatedSavedMinutes:
      input.assignmentCount * 2 + input.folderCount * 5 + input.tagCount + input.aiCacheEntries * 3,
    healthCounters: [
      {
        label: 'Organized conversations',
        status: organizationCoverage >= 0.5 ? 'good' : 'attention',
        value: organizedConversations,
      },
      {
        label: 'Workspace folders',
        status: input.folderCount > 0 ? 'good' : 'attention',
        value: input.folderCount,
      },
      {
        label: 'Saved AI cache entries',
        status: input.aiCacheEntries > 0 ? 'good' : 'attention',
        value: input.aiCacheEntries,
      },
      {
        label: 'Local diagnostics',
        status: input.diagnosticCount === 0 ? 'good' : 'attention',
        value: input.diagnosticCount,
      },
    ],
    workspaceHealthScore,
  };
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
