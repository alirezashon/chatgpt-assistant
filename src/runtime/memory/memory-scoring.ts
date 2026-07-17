import type {
  MemoryConfidence,
  MemoryImportance,
  MemoryObservation,
  MemorySensitivity,
  MemoryType,
} from './memory-types';

/** Scores memory importance from multiple signals. */
export class MemoryImportanceScorer {
  /** Scores importance. */
  public score(input: {
    readonly type: MemoryType;
    readonly observation: MemoryObservation;
    readonly frequency: number;
    readonly futureUsefulness: number;
    readonly now: number;
  }): MemoryImportance {
    const recency = Math.max(0, 1 - (input.now - input.observation.source.timestamp) / 86_400_000);
    const typeBoost = getTypeBoost(input.type);
    const sensitivityPenalty = getSensitivityPenalty(input.observation.sensitivity);
    const score = clamp01(
      input.frequency * 0.2 +
        recency * 0.15 +
        (input.observation.userConfirmed ? 0.25 : 0) +
        input.futureUsefulness * 0.25 +
        (input.observation.taskSuccess ? 0.1 : 0) +
        typeBoost -
        sensitivityPenalty,
    );

    return {
      frequency: input.frequency,
      futureUsefulness: input.futureUsefulness,
      recency,
      score,
      taskSuccess: input.observation.taskSuccess,
      userConfirmed: input.observation.userConfirmed,
    };
  }
}

/** Scores memory confidence. */
export class MemoryConfidenceScorer {
  /** Scores confidence. */
  public score(input: {
    readonly evidenceCount: number;
    readonly sourceTrust: number;
    readonly userConfirmed: boolean;
    readonly contradictionPenalty: number;
  }): MemoryConfidence {
    const score = clamp01(
      input.sourceTrust * 0.45 +
        Math.min(1, input.evidenceCount / 3) * 0.2 +
        (input.userConfirmed ? 0.3 : 0.1) -
        input.contradictionPenalty,
    );

    return {
      contradictionPenalty: input.contradictionPenalty,
      evidenceCount: input.evidenceCount,
      score,
      sourceTrust: input.sourceTrust,
    };
  }
}

function getTypeBoost(type: MemoryType): number {
  if (type === 'preference' || type === 'semantic' || type === 'procedural') {
    return 0.15;
  }

  if (type === 'working') {
    return -0.2;
  }

  return 0;
}

function getSensitivityPenalty(sensitivity: MemorySensitivity): number {
  if (sensitivity === 'restricted') {
    return 0.35;
  }

  if (sensitivity === 'confidential') {
    return 0.2;
  }

  if (sensitivity === 'personal') {
    return 0.05;
  }

  return 0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
