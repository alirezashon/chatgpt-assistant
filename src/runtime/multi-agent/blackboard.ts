import type {
  BlackboardArtifact,
  BlackboardArtifactKind,
  BlackboardSnapshot,
  MultiAgentPermission,
  MultiAgentValue,
} from './multi-agent-types';

/** Shared collaborative workspace with versioned artifacts. */
export class SharedBlackboard {
  private readonly artifacts = new Map<string, BlackboardArtifact>();

  /** Writes a new artifact or appends a version to an existing artifact. */
  public write(input: {
    readonly agentId: string;
    readonly content: MultiAgentValue;
    readonly id?: string;
    readonly kind: BlackboardArtifactKind;
    readonly permissions: readonly MultiAgentPermission[];
    readonly summary: string;
    readonly taskId: string;
  }): BlackboardArtifact {
    const now = Date.now();
    const existing = input.id === undefined ? undefined : this.artifacts.get(input.id);

    if (existing === undefined) {
      const artifact: BlackboardArtifact = {
        content: input.content,
        createdAt: now,
        history: [
          {
            agentId: input.agentId,
            content: input.content,
            summary: input.summary,
            timestamp: now,
            version: 1,
          },
        ],
        id: input.id ?? crypto.randomUUID(),
        kind: input.kind,
        ownerAgentId: input.agentId,
        permissions: input.permissions,
        summary: input.summary,
        taskId: input.taskId,
        updatedAt: now,
        version: 1,
      };
      this.artifacts.set(artifact.id, artifact);
      return artifact;
    }

    const nextVersion = existing.version + 1;
    const next: BlackboardArtifact = {
      ...existing,
      content: input.content,
      history: [
        ...existing.history,
        {
          agentId: input.agentId,
          content: input.content,
          summary: input.summary,
          timestamp: now,
          version: nextVersion,
        },
      ],
      summary: input.summary,
      updatedAt: now,
      version: nextVersion,
    };
    this.artifacts.set(next.id, next);
    return next;
  }

  /** Returns artifacts visible under the provided permissions. */
  public list(permissions: readonly MultiAgentPermission[]): readonly BlackboardArtifact[] {
    return [...this.artifacts.values()].filter((artifact) =>
      artifact.permissions.every((permission) => permissions.includes(permission)),
    );
  }

  /** Returns a snapshot grouped by artifact role. */
  public snapshot(permissions: readonly MultiAgentPermission[]): BlackboardSnapshot {
    const artifacts = this.list(permissions);

    return {
      artifacts,
      decisions: artifacts.filter((artifact) => artifact.kind === 'decision'),
      observations: artifacts.filter((artifact) => artifact.kind === 'observation'),
    };
  }
}
