import type { WorkspaceLifecycleStage } from '@/app/workspace/workspace-types';

export interface WorkspaceLifecycleTransition {
  readonly nextStage: WorkspaceLifecycleStage;
  readonly previousStage: WorkspaceLifecycleStage;
}

export type WorkspaceLifecycleHook = (transition: WorkspaceLifecycleTransition) => void;
export type WorkspaceLifecycleUnsubscribe = () => void;

export class WorkspaceLifecycle {
  private hooks = new Set<WorkspaceLifecycleHook>();
  private stage: WorkspaceLifecycleStage = 'boot';

  public getStage(): WorkspaceLifecycleStage {
    return this.stage;
  }

  public transitionTo(nextStage: WorkspaceLifecycleStage): WorkspaceLifecycleTransition | null {
    if (this.stage === nextStage) {
      return null;
    }

    const transition = {
      nextStage,
      previousStage: this.stage,
    };

    this.stage = nextStage;

    for (const hook of this.hooks) {
      hook(transition);
    }

    return transition;
  }

  public onTransition(hook: WorkspaceLifecycleHook): WorkspaceLifecycleUnsubscribe {
    this.hooks.add(hook);

    return () => {
      this.hooks.delete(hook);
    };
  }

  public clear(): void {
    this.hooks.clear();
  }
}
