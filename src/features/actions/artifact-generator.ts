import type { ActionArtifactDefinition, ProductAction } from './action-types';

/** Returns artifact contracts declared by actions. */
export class ActionArtifactGenerator {
  /** Returns artifact definitions expected from an action. */
  public artifactsFor(action: ProductAction): readonly ActionArtifactDefinition[] {
    return action.artifactsProduced;
  }
}
