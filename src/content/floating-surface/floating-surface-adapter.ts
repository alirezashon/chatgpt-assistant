import type { FloatingSurfaceAdapter, FloatingSurfaceAction } from './floating-surface-types';
import type { MessageContractMap, MessagingRuntime } from '@/runtime';
import {
  ActionContextResolver,
  FIRST_PARTY_ACTIONS,
  FIRST_PARTY_ACTION_REGISTRY,
} from '@/features/actions';
import { requestRuntime } from '@/lib/messaging';
import { saveSidebarTask } from '@/sidebar/workspace/sidebar-workspace-storage';
import { createSidebarTaskFromProductAction } from '@/sidebar/workspace/sidebar-workspace-types';

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

/** Adapter that turns selected text into contextual product actions. */
export class ContextualFloatingSurfaceAdapter implements FloatingSurfaceAdapter {
  private readonly resolver = new ActionContextResolver();

  /** Returns ranked actions for the selected text and page context. */
  public getActions(
    input: Parameters<FloatingSurfaceAdapter['getActions']>[0],
  ): readonly FloatingSurfaceAction[] {
    const actionIds = selectionActionIds(input.selection.codeLike, input.context.selection?.kind);
    const actions = this.resolver
      .resolve({
        actions: FIRST_PARTY_ACTIONS.filter((action) => actionIds.includes(action.id)),
        context: input.context,
      })
      .slice(0, 5);

    return actions.map((entry) => ({
      category: floatingCategory(entry.action.category),
      confidence: entry.confidence,
      icon: entry.action.icon,
      id: entry.action.id,
      permission: input.context.privacy.safeForAI ? 'allowed' : 'prompt',
      title: entry.action.title,
    }));
  }

  /** Executes a selected action in the sidebar workspace. */
  public async executeAction(
    input: Parameters<FloatingSurfaceAdapter['executeAction']>[0],
  ): Promise<void> {
    const action = FIRST_PARTY_ACTION_REGISTRY.get(input.action.id);

    if (action === undefined) {
      return;
    }

    await saveSidebarTask(
      createSidebarTaskFromProductAction({
        action,
        context: input.context,
      }),
    );
    await requestRuntime('content', 'runtime.openSidebar', undefined);
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

function selectionActionIds(
  codeLike: boolean,
  selectionKind: string | undefined,
): readonly string[] {
  if (selectionKind === 'error') {
    return ['code.findBug', 'selection.explain', 'research.topic'];
  }

  if (codeLike || selectionKind === 'code') {
    return [
      'selection.explain',
      'code.findBug',
      'code.generateTests',
      'content.generateDocumentation',
    ];
  }

  if (selectionKind === 'structured-data') {
    return ['data.extractStructured', 'page.summarize', 'research.topic'];
  }

  return ['page.summarize', 'email.improveDraft', 'article.translate', 'memory.saveContext'];
}

function floatingCategory(
  category: (typeof FIRST_PARTY_ACTIONS)[number]['category'],
): FloatingSurfaceAction['category'] {
  switch (category) {
    case 'coding':
      return 'code';
    case 'email':
      return 'communication';
    case 'research':
    case 'learning':
      return 'research';
    case 'writing':
      return 'writing';
    case 'browser':
    case 'meetings':
    case 'productivity':
      return 'context';
  }
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
