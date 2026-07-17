export type SurfaceId =
  | 'command-palette'
  | 'context-menu'
  | 'floating-toolbar'
  | 'popup'
  | 'selection-toolbar'
  | 'sidebar';

export interface SurfaceState {
  readonly activeSurface: SurfaceId | null;
  readonly openedAt?: string;
}
