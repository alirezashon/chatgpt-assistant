import { describe, expect, it } from 'vitest';

import { KEYBOARD_SHORTCUTS } from '@/constants/keyboard-shortcuts';

describe('keyboard shortcuts', () => {
  it('documents the shortcuts implemented in the sidebar', () => {
    expect(KEYBOARD_SHORTCUTS.map((shortcut) => shortcut.keys.join('+'))).toEqual([
      'Ctrl/Cmd+K',
      'Ctrl/Cmd+A',
      'Delete',
      'Escape',
    ]);
  });

  it('keeps shortcut descriptions and scopes visible in settings', () => {
    for (const shortcut of KEYBOARD_SHORTCUTS) {
      expect(shortcut.description.length).toBeGreaterThan(0);
      expect(['sidebar', 'workspace']).toContain(shortcut.scope);
    }
  });
});
