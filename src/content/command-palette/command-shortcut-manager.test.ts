import { describe, expect, it } from 'vitest';

import { CommandShortcutManager } from './command-shortcut-manager';

describe('CommandShortcutManager', () => {
  it('formats shortcut strings', () => {
    const formatted = new CommandShortcutManager().format('Mod+Shift+K');

    expect(formatted).toContain('K');
  });
});
