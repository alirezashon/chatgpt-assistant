export interface KeyboardShortcut {
  readonly description: string;
  readonly keys: readonly string[];
  readonly scope: 'sidebar' | 'workspace';
}

export const KEYBOARD_SHORTCUTS: readonly KeyboardShortcut[] = [
  {
    description: 'Focus workspace search.',
    keys: ['Ctrl/Cmd', 'K'],
    scope: 'workspace',
  },
  {
    description: 'Select all visible conversations in the workspace list.',
    keys: ['Ctrl/Cmd', 'A'],
    scope: 'workspace',
  },
  {
    description: 'Remove selected conversations from their folders.',
    keys: ['Delete'],
    scope: 'workspace',
  },
  {
    description: 'Close menus, dialogs, selection, or the sidebar.',
    keys: ['Escape'],
    scope: 'sidebar',
  },
];
