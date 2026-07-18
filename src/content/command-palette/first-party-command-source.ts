import {
  ActionContextResolver,
  FIRST_PARTY_ACTIONS,
  type ActionCategory,
  type ProductAction,
} from '@/features/actions';
import type { PageContextSnapshot } from '@/features/context';

import type {
  CommandPaletteCommandSource,
  PaletteCommand,
  PaletteCommandCategory,
  PaletteCommandRequiredContext,
} from './command-palette-types';

/** Command source backed by the user-goal action catalog. */
export class FirstPartyCommandSource implements CommandPaletteCommandSource {
  private readonly resolver = new ActionContextResolver();

  /** Returns actions projected as searchable commands for the current page context. */
  public getCommands(context: PageContextSnapshot | null): readonly PaletteCommand[] {
    const actionCommands = this.resolver
      .resolve({
        actions: FIRST_PARTY_ACTIONS,
        context,
      })
      .map((resolved) => actionToCommand(resolved.action, resolved.confidence));

    return [...actionCommands, ...SYSTEM_COMMANDS];
  }
}

const SYSTEM_COMMANDS: readonly PaletteCommand[] = [
  {
    aliases: ['ask', 'ai', 'command', 'spotlight', 'raycast'],
    category: 'ai',
    confidence: 0.92,
    description: 'Search actions and act on the current page.',
    icon: 'ai',
    id: 'runtime.openPalette',
    keywords: ['palette', 'assistant', 'global', 'shortcut'],
    latencyMs: 50,
    namespace: 'system',
    permission: 'allowed',
    permissions: ['activeTab'],
    popularity: 0.9,
    provider: 'Core',
    shortcut: 'Mod+Shift+K',
    tags: ['primary', 'global', 'action'],
    title: 'Open Command Palette',
    usageCount: 0,
  },
  {
    aliases: ['shortcut', 'hotkey', 'keyboard', 'configure shortcut'],
    category: 'system',
    confidence: 0.74,
    description: 'Configure the global command palette shortcut in Chrome.',
    icon: 'settings',
    id: 'system.shortcuts.configure',
    keywords: ['keyboard', 'commands', 'settings'],
    latencyMs: 80,
    namespace: 'system',
    permission: 'allowed',
    permissions: ['tabs'],
    popularity: 0.48,
    provider: 'Core',
    tags: ['settings', 'keyboard'],
    title: 'Customize Keyboard Shortcuts',
    usageCount: 0,
  },
];

function actionToCommand(action: ProductAction, confidence: number): PaletteCommand {
  const requiredContext = requiredContextForAction(action);
  const command: PaletteCommand = {
    aliases: action.aliases,
    category: categoryForAction(action.category),
    confidence,
    description: action.description,
    icon: action.icon,
    id: action.id,
    keywords: [...action.tags, action.category, ...action.requiredAiTools],
    latencyMs: action.estimatedDurationSec * 1000,
    namespace: 'action',
    permission: 'allowed',
    permissions: action.requiredPermissions,
    popularity: action.popularity,
    provider: 'Action Catalog',
    tags: action.tags,
    title: action.title,
    usageCount: 0,
    ...(action.shortcut === undefined ? {} : { shortcut: action.shortcut }),
    ...(requiredContext === undefined ? {} : { requiredContext }),
  };

  return command;
}

function requiredContextForAction(
  action: ProductAction,
): PaletteCommandRequiredContext | undefined {
  if (action.supportedContexts.length !== 1) {
    return undefined;
  }

  return action.supportedContexts[0] ?? undefined;
}

function categoryForAction(category: ActionCategory): PaletteCommandCategory {
  switch (category) {
    case 'browser':
      return 'browser';
    case 'coding':
      return 'coding';
    case 'email':
    case 'language':
    case 'writing':
      return 'writing';
    case 'learning':
    case 'media':
    case 'research':
      return 'research';
    case 'meetings':
    case 'productivity':
      return 'workflow';
  }
}
