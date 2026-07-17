import { STORAGE_SCHEMA_VERSION } from '@/constants/storage';

export type PrivacyMode = 'balanced' | 'local-first' | 'manual';

export interface ExtensionSettings {
  readonly commandPaletteShortcut: string;
  readonly disabledHosts: readonly string[];
  readonly enabledSurfaces: {
    readonly commandPalette: boolean;
    readonly contextMenu: boolean;
    readonly floatingToolbar: boolean;
    readonly selectionToolbar: boolean;
    readonly sidebar: boolean;
  };
  readonly privacyMode: PrivacyMode;
  readonly schemaVersion: number;
}

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  commandPaletteShortcut: 'Mod+Shift+K',
  disabledHosts: [],
  enabledSurfaces: {
    commandPalette: true,
    contextMenu: true,
    floatingToolbar: true,
    selectionToolbar: true,
    sidebar: true,
  },
  privacyMode: 'balanced',
  schemaVersion: STORAGE_SCHEMA_VERSION,
};
