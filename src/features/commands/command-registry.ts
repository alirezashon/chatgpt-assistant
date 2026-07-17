import type { CommandDefinition } from './command-types';

export const FOUNDATION_COMMANDS: readonly CommandDefinition[] = [
  {
    availability: {},
    description: 'Open the contextual command palette.',
    id: 'runtime.openPalette',
    outputMode: 'inline',
    title: 'Open Command Palette',
  },
  {
    availability: {},
    description: 'Open the extension sidebar for longer workflows.',
    id: 'runtime.openSidebar',
    outputMode: 'sidebar',
    title: 'Open Sidebar',
  },
  {
    availability: {},
    description: 'Summarize the current page using the future AI provider layer.',
    id: 'page.summarize',
    outputMode: 'sidebar',
    title: 'Summarize Page',
  },
  {
    availability: {
      requiresSelection: true,
    },
    description: 'Explain selected text or code.',
    id: 'selection.explain',
    outputMode: 'inline',
    title: 'Explain Selection',
  },
  {
    availability: {
      requiresSelection: true,
    },
    description: 'Rewrite selected text in place.',
    id: 'selection.rewrite',
    outputMode: 'replace-selection',
    title: 'Rewrite Selection',
  },
  {
    availability: {
      requiresEditableTarget: true,
    },
    description: 'Improve text in the active input field.',
    id: 'input.rewrite',
    outputMode: 'replace-selection',
    title: 'Improve Writing',
  },
];

export function getCommandById(id: string): CommandDefinition | undefined {
  return FOUNDATION_COMMANDS.find((command) => command.id === id);
}
