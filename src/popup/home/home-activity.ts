import { STORAGE_KEYS } from '@/constants/storage';
import type { AIHistoryEntry } from '@/features/ai/ai-types';
import type { SearchHistoryItem } from '@/features/search/search-types';
import { hasChromeRuntime } from '@/lib/chrome/chrome-api';
import { ChromeExtensionStorage } from '@/lib/storage';

import { RESEARCH_ACTION, SUMMARIZE_ACTION, WORKFLOW_ACTION } from './home-actions';
import type { HomeActivity, HomeActivityState } from './home-types';

/** Loads real recent activity for the Home screen. */
export async function loadHomeActivity(): Promise<HomeActivityState> {
  if (!hasChromeRuntime()) {
    return { recent: [], smartSuggestions: [] };
  }

  const storage = new ChromeExtensionStorage('local');
  const values = await storage.getMany([STORAGE_KEYS.aiHistory, STORAGE_KEYS.searchHistory, STORAGE_KEYS.tasks]);
  const aiHistory = readArray(values[STORAGE_KEYS.aiHistory]).filter(isAIHistoryEntry);
  const searchHistory = readArray(values[STORAGE_KEYS.searchHistory]).filter(isSearchHistoryItem);
  const recent = [
    ...aiHistory.map(aiHistoryToActivity),
    ...searchHistory.map(searchHistoryToActivity),
  ]
    .sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt))
    .slice(0, 5);
  const smartSuggestions = buildSmartSuggestions(recent, aiHistory);

  return { recent, smartSuggestions };
}

function readArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function isAIHistoryEntry(value: unknown): value is AIHistoryEntry {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['jobId'] === 'string' &&
    typeof candidate['status'] === 'string' &&
    typeof candidate['taskType'] === 'string'
  );
}

function isSearchHistoryItem(value: unknown): value is SearchHistoryItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['pinned'] === 'boolean' &&
    typeof candidate['query'] === 'string'
  );
}

function aiHistoryToActivity(entry: AIHistoryEntry): HomeActivity {
  const action = taskTypeAction(entry.taskType);

  return {
    action,
    completedAt: entry.createdAt,
    id: entry.id,
    label: entry.status === 'failed' ? `Retry ${action.title}` : pastTense(action.title),
  };
}

function searchHistoryToActivity(item: SearchHistoryItem): HomeActivity {
  return {
    action: RESEARCH_ACTION,
    completedAt: item.createdAt,
    id: item.id,
    label: `Researched ${item.query}`,
  };
}

function buildSmartSuggestions(
  recent: readonly HomeActivity[],
  aiHistory: readonly AIHistoryEntry[],
): readonly HomeActivity[] {
  const failed = aiHistory.find((entry) => entry.status === 'failed');

  if (failed !== undefined) {
    const action = taskTypeAction(failed.taskType);

    return [
      {
        action,
        completedAt: failed.createdAt,
        id: `retry-${failed.id}`,
        label: `Retry ${action.title}`,
      },
    ];
  }

  const latest = recent[0];

  if (latest === undefined) {
    return [];
  }

  return [
    {
      action: latest.action,
      completedAt: latest.completedAt,
      id: `continue-${latest.id}`,
      label: `Continue ${latest.action.title}`,
    },
  ];
}

function taskTypeAction(taskType: AIHistoryEntry['taskType']) {
  switch (taskType) {
    case 'conversation-summarization':
    case 'workspace-analytics':
      return SUMMARIZE_ACTION;
    case 'natural-language-search':
    case 'find-similar':
    case 'related-conversations':
      return RESEARCH_ACTION;
    case 'future-ai-agent':
    case 'workspace-cleanup':
      return WORKFLOW_ACTION;
    default:
      return RESEARCH_ACTION;
  }
}

function pastTense(title: string): string {
  if (title.startsWith('Summarize')) {
    return title.replace('Summarize', 'Summarized');
  }

  if (title.startsWith('Research')) {
    return title.replace('Research', 'Researched');
  }

  if (title.startsWith('Run')) {
    return title.replace('Run', 'Ran');
  }

  return title;
}
