import { STORAGE_SCHEMA_VERSION } from '@/constants/storage';
import type { WorkspaceSettings } from '@/shared/types';

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  enableDebugLogging: false,
  schemaVersion: STORAGE_SCHEMA_VERSION,
  sidebarWidth: 380,
  theme: 'light',
  themePreset: 'classic',
};
