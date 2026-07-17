import type { PageContextSnapshot } from './context-types';

const MAX_MEMORY = 5;

/** Temporary in-tab context memory for multi-step workflows. */
export class ContextMemory {
  private snapshots: PageContextSnapshot[] = [];

  /** Remembers the latest context snapshot. */
  public remember(snapshot: PageContextSnapshot): void {
    this.snapshots = [
      snapshot,
      ...this.snapshots.filter((candidate) => candidate.url !== snapshot.url),
    ].slice(0, MAX_MEMORY);
  }

  /** Returns recent context snapshots. */
  public recent(): readonly PageContextSnapshot[] {
    return this.snapshots;
  }

  /** Clears temporary context memory. */
  public clear(): void {
    this.snapshots = [];
  }
}

export const contextMemory = new ContextMemory();
