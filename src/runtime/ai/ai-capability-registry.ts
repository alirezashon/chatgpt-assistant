import type { AIModelCapability, AITaskType } from './ai-types';

/** Maps permanent platform tasks to replaceable model capabilities. */
export class AIModelCapabilityRegistry {
  private readonly capabilitiesByTask = new Map<AITaskType, readonly AIModelCapability[]>();

  public constructor() {
    for (const [task, capabilities] of defaultMappings()) {
      this.capabilitiesByTask.set(task, capabilities);
    }
  }

  /** Registers task capability requirements. */
  public register(taskType: AITaskType, capabilities: readonly AIModelCapability[]): void {
    this.capabilitiesByTask.set(taskType, capabilities);
  }

  /** Resolves capabilities for task. */
  public forTask(taskType: AITaskType): readonly AIModelCapability[] {
    return this.capabilitiesByTask.get(taskType) ?? ['text-generation'];
  }
}

function defaultMappings(): readonly (readonly [AITaskType, readonly AIModelCapability[]])[] {
  return [
    ['automation', ['planning', 'tool-use']],
    ['classification', ['json-output', 'text-generation']],
    ['code-review', ['coding', 'analysis']],
    ['coding', ['coding', 'text-generation']],
    ['conversation', ['text-generation']],
    ['embedding', ['embeddings']],
    ['extraction', ['json-output', 'text-generation']],
    ['planning', ['planning', 'reasoning']],
    ['reasoning', ['reasoning', 'analysis']],
    ['research', ['research', 'analysis']],
    ['rewrite', ['text-generation']],
    ['summarization', ['text-generation']],
    ['translation', ['text-generation']],
    ['vision', ['vision']],
  ];
}
