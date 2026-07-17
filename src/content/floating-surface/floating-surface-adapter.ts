import type { FloatingSurfaceAdapter, FloatingSurfaceAction } from './floating-surface-types';
import type { MessageContractMap, MessagingRuntime } from '@/runtime';

/** Empty adapter used until Action Intelligence and Command Platform providers are connected. */
export class EmptyFloatingSurfaceAdapter implements FloatingSurfaceAdapter {
  /** Returns no actions. */
  public getActions(): readonly FloatingSurfaceAction[] {
    return [];
  }

  /** Executes no action. */
  public executeAction(): void {
    return undefined;
  }
}

/** Messaging contracts used to bridge the surface to Action Intelligence and Command Platform. */
export interface FloatingSurfaceMessageContracts extends MessageContractMap {
  /** Requests contextual action candidates. */
  readonly 'floating.actions.get': {
    readonly request: {
      readonly context: unknown;
      readonly selection: unknown;
    };
    readonly response: {
      readonly actions: readonly FloatingSurfaceAction[];
    };
  };
  /** Executes a selected contextual action. */
  readonly 'floating.action.execute': {
    readonly request: {
      readonly action: FloatingSurfaceAction;
      readonly context: unknown;
      readonly selection: unknown;
    };
    readonly response: {
      readonly ok: true;
    };
  };
}

/** Adapter that delegates action generation and execution through the typed messaging runtime. */
export class MessagingFloatingSurfaceAdapter implements FloatingSurfaceAdapter {
  public constructor(
    private readonly messaging: MessagingRuntime<FloatingSurfaceMessageContracts>,
  ) {}

  /** Requests dynamic actions from the platform runtime. */
  public async getActions(
    input: Parameters<FloatingSurfaceAdapter['getActions']>[0],
  ): Promise<readonly FloatingSurfaceAction[]> {
    const response = await this.messaging.request('floating.actions.get', input, {
      retries: 1,
      timeoutMs: 1200,
    });

    return response.actions;
  }

  /** Delegates execution to the command/action runtime. */
  public async executeAction(
    input: Parameters<FloatingSurfaceAdapter['executeAction']>[0],
  ): Promise<void> {
    await this.messaging.request('floating.action.execute', input, {
      retries: 0,
      timeoutMs: 5000,
    });
  }
}
