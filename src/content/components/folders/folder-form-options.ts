import type { FolderIconName } from '@/content/components/folders/folder-ui-types';

export const FOLDER_COLOR_OPTIONS = [
  '#111827',
  '#2563eb',
  '#059669',
  '#dc2626',
  '#7c3aed',
  '#d97706',
] as const;

export const FOLDER_ICON_OPTIONS: readonly FolderIconName[] = ['folder', 'briefcase', 'bookmark'];
