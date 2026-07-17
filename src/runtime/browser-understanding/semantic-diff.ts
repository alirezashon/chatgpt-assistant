import type {
  SemanticDiff,
  SemanticDiffEntry,
  SemanticElement,
  SemanticPageModel,
} from './browser-understanding-types';

/** Computes semantic diffs between page snapshots. */
export class SemanticDiffEngine {
  /** Computes changes between two models. */
  public diff(previous: SemanticPageModel, next: SemanticPageModel): SemanticDiff {
    const previousByFingerprint = new Map(
      previous.elements.map((element) => [element.reference.fingerprint, element]),
    );
    const nextByFingerprint = new Map(
      next.elements.map((element) => [element.reference.fingerprint, element]),
    );
    const changes: SemanticDiffEntry[] = [];

    for (const [fingerprint, element] of nextByFingerprint) {
      const old = previousByFingerprint.get(fingerprint);

      if (old === undefined) {
        changes.push({
          elementId: element.id,
          summary: `Added ${element.role}: ${element.name}`,
          type: 'added',
        });
        continue;
      }

      changes.push(...compareElement(old, element));
    }

    for (const [fingerprint, element] of previousByFingerprint) {
      if (!nextByFingerprint.has(fingerprint)) {
        changes.push({
          elementId: element.id,
          summary: `Removed ${element.role}: ${element.name}`,
          type: 'removed',
        });
      }
    }

    return {
      changes,
      nextId: next.id,
      previousId: previous.id,
    };
  }
}

function compareElement(
  previous: SemanticElement,
  next: SemanticElement,
): readonly SemanticDiffEntry[] {
  const changes: SemanticDiffEntry[] = [];

  if (previous.text !== next.text || previous.name !== next.name) {
    changes.push({
      elementId: next.id,
      summary: `Text changed for ${next.role}: ${next.name}`,
      type: 'text-changed',
    });
  }

  if (
    previous.state.disabled !== next.state.disabled ||
    previous.state.hidden !== next.state.hidden ||
    previous.state.selected !== next.state.selected
  ) {
    changes.push({
      elementId: next.id,
      summary: `State changed for ${next.role}: ${next.name}`,
      type: 'state-changed',
    });
  }

  return changes;
}
