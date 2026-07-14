export const UI_DIMENSIONS = {
  edgeOffset: 24,
  floatingButtonSize: 56,
  sidebarBorderRadius: 16,
  sidebarClosedOffset: 24,
  sidebarWidth: 380,
} as const;

export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 300,
} as const;

export const UI_CSS_VARIABLES = {
  animationFast: '--cgw-animation-fast',
  animationNormal: '--cgw-animation-normal',
  accent: '--cgw-accent',
  border: '--cgw-border',
  button: '--cgw-button',
  buttonText: '--cgw-button-text',
  edgeOffset: '--cgw-edge-offset',
  floatingButtonSize: '--cgw-floating-button-size',
  muted: '--cgw-muted',
  sidebarBorderRadius: '--cgw-sidebar-border-radius',
  sidebarClosedOffset: '--cgw-sidebar-closed-offset',
  sidebarWidth: '--cgw-sidebar-width',
  surface: '--cgw-surface',
  text: '--cgw-text',
} as const;
