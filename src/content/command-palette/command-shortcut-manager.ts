/** Normalizes platform shortcut display and matching. */
export class CommandShortcutManager {
  /** Returns a display-ready shortcut for the current platform. */
  public format(shortcut: string | undefined): string | undefined {
    if (shortcut === undefined) {
      return undefined;
    }

    const isMac = navigator.platform.toLowerCase().includes('mac');

    return shortcut
      .replaceAll('Mod', isMac ? '⌘' : 'Ctrl')
      .replaceAll('Shift', isMac ? '⇧' : 'Shift')
      .replaceAll('Alt', isMac ? '⌥' : 'Alt');
  }
}
