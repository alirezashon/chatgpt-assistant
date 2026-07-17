import type { WorkspaceThemePreset } from '@/shared/types';

export interface WorkspaceThemePresetDefinition {
  readonly accent: string;
  readonly border: string;
  readonly button: string;
  readonly buttonText: string;
  readonly description: string;
  readonly id: WorkspaceThemePreset;
  readonly muted: string;
  readonly name: string;
  readonly surface: string;
  readonly text: string;
}

const CLASSIC_WORKSPACE_THEME_PRESET: WorkspaceThemePresetDefinition = {
  accent: '#0f766e',
  border: '#d7e5df',
  button: '#111827',
  buttonText: '#ffffff',
  description: 'Crisp neutral styling with calm emerald accents.',
  id: 'classic',
  muted: '#eef7f3',
  name: 'Classic',
  surface: '#fbfefd',
  text: '#111827',
};

export const WORKSPACE_THEME_PRESETS: readonly WorkspaceThemePresetDefinition[] = [
  CLASSIC_WORKSPACE_THEME_PRESET,
  {
    accent: '#0891b2',
    border: '#bae6fd',
    button: '#0e7490',
    buttonText: '#ecfeff',
    description: 'Bright cyan details with a softer workspace shell.',
    id: 'ocean',
    muted: '#ecfeff',
    name: 'Ocean',
    surface: '#f8feff',
    text: '#164e63',
  },
  {
    accent: '#7c3aed',
    border: '#ddd6fe',
    button: '#6d28d9',
    buttonText: '#ffffff',
    description: 'Sharper violet accents for a more premium sidebar.',
    id: 'violet',
    muted: '#f5f3ff',
    name: 'Violet',
    surface: '#fdfcff',
    text: '#2e1065',
  },
  {
    accent: '#059669',
    border: '#bbf7d0',
    button: '#047857',
    buttonText: '#ecfdf5',
    description: 'Calm green styling for long organization sessions.',
    id: 'mint',
    muted: '#f0fdf4',
    name: 'Mint',
    surface: '#fbfffd',
    text: '#064e3b',
  },
] as const;

export function getWorkspaceThemePreset(
  presetId: WorkspaceThemePreset,
): WorkspaceThemePresetDefinition {
  return (
    WORKSPACE_THEME_PRESETS.find((preset) => preset.id === presetId) ??
    CLASSIC_WORKSPACE_THEME_PRESET
  );
}
