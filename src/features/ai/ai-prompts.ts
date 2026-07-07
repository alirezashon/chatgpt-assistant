import type { AIPromptTemplate, AITaskType } from '@/features/ai/ai-types';

export const DEFAULT_AI_PROMPTS: readonly AIPromptTemplate[] = [
  {
    id: 'summarize-conversation-v1',
    taskType: 'conversation-summarization',
    template: 'Summarize the selected conversation for workspace organization.',
    version: '1',
  },
  {
    id: 'suggest-folder-v1',
    taskType: 'auto-folder-suggestion',
    template: 'Suggest the best folder for the selected conversation.',
    version: '1',
  },
  {
    id: 'extract-topics-v1',
    taskType: 'extract-topics',
    template: 'Extract concise workspace topics from the selected context.',
    version: '1',
  },
];

export class AIPrompts {
  private readonly prompts = new Map<string, AIPromptTemplate>();

  public constructor(prompts: readonly AIPromptTemplate[] = DEFAULT_AI_PROMPTS) {
    for (const prompt of prompts) {
      this.prompts.set(prompt.id, prompt);
    }
  }

  public getPrompt(promptId: string | undefined, taskType: AITaskType): AIPromptTemplate | null {
    if (promptId !== undefined) {
      return this.prompts.get(promptId) ?? null;
    }

    return [...this.prompts.values()].find((prompt) => prompt.taskType === taskType) ?? null;
  }
}
