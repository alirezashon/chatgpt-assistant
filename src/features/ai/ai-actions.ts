import type { AIActionDefinition } from '@/features/ai/ai-types';

export const AI_ACTIONS: readonly AIActionDefinition[] = [
  {
    description: 'Create a concise local-first summary when a provider is enabled.',
    id: 'summarize',
    label: 'Summarize',
    taskType: 'conversation-summarization',
  },
  {
    description: 'Suggest the best workspace folder.',
    id: 'suggest-folder',
    label: 'Suggest Folder',
    taskType: 'auto-folder-suggestion',
  },
  {
    description: 'Find related workspace conversations.',
    id: 'find-similar',
    label: 'Find Similar',
    taskType: 'related-conversations',
  },
  {
    description: 'Extract organization topics.',
    id: 'extract-topics',
    label: 'Extract Topics',
    taskType: 'extract-topics',
  },
  {
    description: 'Generate local notes from selected context.',
    id: 'generate-notes',
    label: 'Generate Notes',
    taskType: 'workspace-cleanup',
  },
  {
    description: 'Placeholder for future rewrite actions.',
    id: 'rewrite',
    label: 'Rewrite',
    taskType: 'prompt-recommendation',
  },
  {
    description: 'Placeholder for future translation actions.',
    id: 'translate',
    label: 'Translate',
    taskType: 'conversation-summarization',
  },
  {
    description: 'Placeholder for future explanation actions.',
    id: 'explain',
    label: 'Explain',
    taskType: 'conversation-summarization',
  },
  {
    description: 'Placeholder for future categorization actions.',
    id: 'categorize',
    label: 'Categorize',
    taskType: 'tag-recommendation',
  },
];
