/** Permanent design-system token names and reusable class fragments. */
export const ds = {
  animation: {
    fast: 'duration-[var(--ds-duration-fast)] ease-[var(--ds-ease-standard)]',
    medium: 'duration-[var(--ds-duration-medium)] ease-[var(--ds-ease-standard)]',
  },
  blur: {
    panel: 'backdrop-blur-[var(--ds-blur-panel)]',
  },
  border: {
    default: 'border border-[color:var(--ds-color-border)]',
    strong: 'border border-[color:var(--ds-color-border-strong)]',
  },
  color: {
    accent: 'text-[color:var(--ds-color-accent)]',
    background: 'bg-[var(--ds-color-background)]',
    body: 'text-[color:var(--ds-color-text)]',
    caption: 'text-[color:var(--ds-color-text-muted)]',
    danger: 'text-[color:var(--ds-color-danger)]',
    heading: 'text-[color:var(--ds-color-text-strong)]',
    info: 'text-[color:var(--ds-color-info)]',
    inverse: 'text-[color:var(--ds-color-text-inverse)]',
    muted: 'text-[color:var(--ds-color-text-subtle)]',
    success: 'text-[color:var(--ds-color-success)]',
    warning: 'text-[color:var(--ds-color-warning)]',
  },
  elevation: {
    floating: 'shadow-[var(--ds-shadow-floating)]',
    panel: 'shadow-[var(--ds-shadow-panel)]',
  },
  focus:
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ds-color-focus)]',
  icon: {
    lg: 'h-[var(--ds-icon-lg)] w-[var(--ds-icon-lg)]',
    md: 'h-[var(--ds-icon-md)] w-[var(--ds-icon-md)]',
    sm: 'h-[var(--ds-icon-sm)] w-[var(--ds-icon-sm)]',
  },
  layout: {
    contentWidth: 'max-w-[var(--ds-content-width)]',
    popupWidth: 'w-[var(--ds-popup-width)]',
    sidebarWidth: 'max-w-[var(--ds-sidebar-content-width)]',
  },
  radius: {
    lg: 'rounded-[var(--ds-radius-lg)]',
    md: 'rounded-[var(--ds-radius-md)]',
    sm: 'rounded-[var(--ds-radius-sm)]',
  },
  surface: {
    background: 'bg-[var(--ds-color-background)]',
    elevated: 'bg-[var(--ds-color-surface)]',
    panel: 'bg-[var(--ds-color-panel)]',
    subtle: 'bg-[var(--ds-color-surface-subtle)]',
  },
  text: {
    body: 'text-[length:var(--ds-font-body)] leading-[var(--ds-line-body)]',
    caption: 'text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)]',
    heading: 'text-[length:var(--ds-font-heading)] leading-[var(--ds-line-heading)] font-semibold tracking-normal',
    label:
      'text-[length:var(--ds-font-label)] leading-[var(--ds-line-label)] font-medium uppercase tracking-[var(--ds-letter-label)]',
    mono: 'font-mono text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)]',
    subtitle: 'text-[length:var(--ds-font-subtitle)] leading-[var(--ds-line-subtitle)]',
    title: 'text-[length:var(--ds-font-title)] leading-[var(--ds-line-title)] font-semibold tracking-normal',
  },
} as const;

/** Design-system status intent. */
export type DesignIntent = 'accent' | 'danger' | 'info' | 'muted' | 'success' | 'warning';
