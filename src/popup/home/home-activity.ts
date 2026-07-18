import { STORAGE_KEYS } from '@/constants/storage';
import type { AIHistoryEntry } from '@/features/ai/ai-types';
import type { SearchHistoryItem } from '@/features/search/search-types';
import type { AppLocale } from '@/i18n';
import { hasChromeRuntime } from '@/lib/chrome/chrome-api';
import { ChromeExtensionStorage } from '@/lib/storage';

import { researchAction, summarizeAction, workflowAction } from './home-actions';
import type { HomeActivity, HomeActivityState } from './home-types';

/** Loads real recent activity for the Home screen. */
export async function loadHomeActivity(locale: AppLocale): Promise<HomeActivityState> {
  if (!hasChromeRuntime()) {
    return { recent: [], smartSuggestions: [] };
  }

  const storage = new ChromeExtensionStorage('local');
  const values = await storage.getMany([
    STORAGE_KEYS.aiHistory,
    STORAGE_KEYS.searchHistory,
    STORAGE_KEYS.tasks,
  ]);
  const aiHistory = readArray(values[STORAGE_KEYS.aiHistory]).filter(isAIHistoryEntry);
  const searchHistory = readArray(values[STORAGE_KEYS.searchHistory]).filter(isSearchHistoryItem);
  const recent = [
    ...aiHistory.map((entry) => aiHistoryToActivity(entry, locale)),
    ...searchHistory.map((item) => searchHistoryToActivity(item, locale)),
  ]
    .sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt))
    .slice(0, 5);
  const smartSuggestions = buildSmartSuggestions(recent, aiHistory, locale);

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

function aiHistoryToActivity(entry: AIHistoryEntry, locale: AppLocale): HomeActivity {
  const action = taskTypeAction(entry.taskType, locale);

  return {
    action,
    completedAt: entry.createdAt,
    id: entry.id,
    label:
      entry.status === 'failed'
        ? locale === 'fa'
          ? `تلاش دوباره: ${action.title}`
          : `Retry ${action.title}`
        : pastTense(action.title, locale),
  };
}

function searchHistoryToActivity(item: SearchHistoryItem, locale: AppLocale): HomeActivity {
  return {
    action: researchAction(locale),
    completedAt: item.createdAt,
    id: item.id,
    label: locale === 'fa' ? `پژوهش: ${item.query}` : `Researched ${item.query}`,
  };
}

function buildSmartSuggestions(
  recent: readonly HomeActivity[],
  aiHistory: readonly AIHistoryEntry[],
  locale: AppLocale,
): readonly HomeActivity[] {
  const failed = aiHistory.find((entry) => entry.status === 'failed');

  if (failed !== undefined) {
    const action = taskTypeAction(failed.taskType, locale);

    return [
      {
        action,
        completedAt: failed.createdAt,
        id: `retry-${failed.id}`,
        label: locale === 'fa' ? `تلاش دوباره: ${action.title}` : `Retry ${action.title}`,
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
      label: locale === 'fa' ? `ادامه: ${latest.action.title}` : `Continue ${latest.action.title}`,
    },
  ];
}

function taskTypeAction(taskType: AIHistoryEntry['taskType'], locale: AppLocale) {
  switch (taskType) {
    case 'conversation-summarization':
    case 'workspace-analytics':
      return summarizeAction(locale);
    case 'natural-language-search':
    case 'find-similar':
    case 'related-conversations':
      return researchAction(locale);
    case 'future-ai-agent':
    case 'workspace-cleanup':
      return workflowAction(locale);
    default:
      return researchAction(locale);
  }
}

function pastTense(title: string, locale: AppLocale): string {
  if (locale === 'fa') {
    return `انجام شد: ${title}`;
  }

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
