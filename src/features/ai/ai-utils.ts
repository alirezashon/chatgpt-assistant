import type { AIJobPriority, AITaskRequest, AITaskType } from '@/features/ai/ai-types';

const PRIORITY_WEIGHT: Readonly<Record<AIJobPriority, number>> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export function createAIId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAITimestamp(): string {
  return new Date().toISOString();
}

export function compareAIJobPriority(left: AIJobPriority, right: AIJobPriority): number {
  return PRIORITY_WEIGHT[right] - PRIORITY_WEIGHT[left];
}

export function createAICacheKey(request: AITaskRequest): string {
  return [
    request.type,
    normalizeAIText(request.input),
    request.context.conversation?.id ?? 'workspace',
    request.context.folder?.id ?? 'all-folders',
  ].join(':');
}

export function normalizeAIText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ').toLocaleLowerCase();
}

export function isKnownAITaskType(value: string): value is AITaskType {
  return AI_TASK_TYPES.includes(value as AITaskType);
}

export const AI_TASK_TYPES: readonly AITaskType[] = [
  'auto-folder-suggestion',
  'conversation-naming',
  'conversation-summarization',
  'duplicate-detection',
  'extract-topics',
  'find-similar',
  'future-ai-agent',
  'natural-language-search',
  'prompt-recommendation',
  'related-conversations',
  'tag-recommendation',
  'workspace-analytics',
  'workspace-cleanup',
];
