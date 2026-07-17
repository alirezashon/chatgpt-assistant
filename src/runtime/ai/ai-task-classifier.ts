import { AIModelCapabilityRegistry } from './ai-capability-registry';
import type { AIClassifiedTask, AITaskType } from './ai-types';

/** Deterministic task classifier used before model routing. */
export class AITaskClassifier {
  public constructor(private readonly capabilities = new AIModelCapabilityRegistry()) {}

  /** Classifies a natural-language intelligence request. */
  public classify(input: {
    readonly intent: string;
    readonly hasImages?: boolean;
    readonly hasAudio?: boolean;
  }): AIClassifiedTask {
    const intent = input.intent.toLowerCase();
    const taskType = chooseTaskType(intent, input.hasImages ?? false, input.hasAudio ?? false);

    return {
      latencyRequirementMs: taskType === 'conversation' || taskType === 'summarization' ? 2_000 : 8_000,
      qualityRequirement: ['reasoning', 'coding', 'planning', 'research', 'code-review'].includes(taskType) ? 0.85 : 0.65,
      reason: `Classified intent as ${taskType}.`,
      requiredCapabilities: this.capabilities.forTask(taskType),
      taskType,
    };
  }
}

function chooseTaskType(intent: string, hasImages: boolean, hasAudio: boolean): AITaskType {
  if (hasImages) {
    return 'vision';
  }

  if (hasAudio) {
    return 'conversation';
  }

  if (/\b(refactor|code|bug|typescript|react|api|function|class)\b/.test(intent)) {
    return intent.includes('review') ? 'code-review' : 'coding';
  }

  if (/\b(research|find sources|competitor|investigate)\b/.test(intent)) {
    return 'research';
  }

  if (/\b(reason|analyze|diagnose|decide|compare)\b/.test(intent)) {
    return 'reasoning';
  }

  if (/\b(plan|architecture|strategy|roadmap|decompose)\b/.test(intent)) {
    return 'planning';
  }

  if (/\b(extract|json|parse|fields)\b/.test(intent)) {
    return 'extraction';
  }

  if (/\b(translate|translation)\b/.test(intent)) {
    return 'translation';
  }

  if (/\b(rewrite|improve writing|tone)\b/.test(intent)) {
    return 'rewrite';
  }

  if (/\b(summarize|summary|tl;dr)\b/.test(intent)) {
    return 'summarization';
  }

  if (/\b(automate|workflow|execute)\b/.test(intent)) {
    return 'automation';
  }

  return 'conversation';
}
