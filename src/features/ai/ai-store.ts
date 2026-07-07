import { DEFAULT_AI_SETTINGS } from '@/features/ai/ai-config';
import type { AIState } from '@/features/ai/ai-types';
import { createStore } from '@/state';

export const initialAIState: AIState = {
  activeJobs: [],
  error: null,
  history: [],
  settings: DEFAULT_AI_SETTINGS,
  status: 'disabled',
};

export const aiStore = createStore<AIState>(initialAIState);
