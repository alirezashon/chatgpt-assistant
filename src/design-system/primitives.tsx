import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/utils';

import { ds, type DesignIntent } from './tokens';

const buttonStyles = cva(
  cn(
    'inline-flex select-none items-center justify-center gap-[var(--ds-space-2)] font-medium transition disabled:cursor-not-allowed disabled:opacity-[var(--ds-opacity-disabled)]',
    ds.focus,
    ds.animation.fast,
  ),
  {
    defaultVariants: {
      size: 'md',
      variant: 'secondary',
    },
    variants: {
      size: {
        sm: 'h-[var(--ds-control-sm)] px-[var(--ds-space-2)] text-[length:var(--ds-font-caption)]',
        md: 'h-[var(--ds-control-md)] px-[var(--ds-space-3)] text-[length:var(--ds-font-body)]',
      },
      variant: {
        ghost: cn(
          ds.radius.md,
          'text-[color:var(--ds-color-text-muted)] hover:bg-[var(--ds-color-hover)] hover:text-[color:var(--ds-color-text)]',
        ),
        primary: cn(
          ds.radius.md,
          'bg-[var(--ds-color-primary)] text-[color:var(--ds-color-text-inverse)] shadow-[var(--ds-shadow-accent)] hover:bg-[var(--ds-color-primary-hover)]',
        ),
        secondary: cn(
          ds.radius.md,
          ds.border.default,
          'bg-[var(--ds-color-secondary)] text-[color:var(--ds-color-text)] hover:border-[color:var(--ds-color-border-strong)] hover:bg-[var(--ds-color-hover)]',
        ),
      },
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  readonly icon?: LucideIcon;
}

export function Button({ children, className, icon: Icon, size, variant, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonStyles({ size, variant }), className)} type="button" {...props}>
      {Icon === undefined ? null : <Icon aria-hidden="true" className={ds.icon.md} />}
      {children}
    </button>
  );
}

const iconButtonStyles = cva(
  cn(
    'grid place-items-center transition disabled:cursor-not-allowed disabled:opacity-[var(--ds-opacity-disabled)]',
    ds.focus,
    ds.animation.fast,
    ds.radius.md,
  ),
  {
    defaultVariants: {
      size: 'md',
      variant: 'secondary',
    },
    variants: {
      size: {
        sm: 'h-[var(--ds-control-sm)] w-[var(--ds-control-sm)]',
        md: 'h-[var(--ds-control-md)] w-[var(--ds-control-md)]',
      },
      variant: {
        ghost: 'text-[color:var(--ds-color-text-muted)] hover:bg-[var(--ds-color-hover)] hover:text-[color:var(--ds-color-text)]',
        secondary:
          'border border-[color:var(--ds-color-border)] bg-[var(--ds-color-secondary)] text-[color:var(--ds-color-text-muted)] hover:border-[color:var(--ds-color-border-strong)] hover:bg-[var(--ds-color-hover)] hover:text-[color:var(--ds-color-text)]',
      },
    },
  },
);

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof iconButtonStyles> {
  readonly icon: LucideIcon;
  readonly label: string;
}

export function IconButton({ className, icon: Icon, label, size, variant, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(iconButtonStyles({ size, variant }), className)}
      title={label}
      type="button"
      {...props}
    >
      <Icon aria-hidden="true" className={ds.icon.md} />
    </button>
  );
}

const panelStyles = cva(cn(ds.radius.lg, ds.border.default), {
  defaultVariants: {
    tone: 'default',
  },
  variants: {
    tone: {
      accent: 'border-[color:var(--ds-color-accent-border)] bg-[var(--ds-color-accent-surface)] shadow-[var(--ds-shadow-panel)]',
      default: 'bg-[var(--ds-color-panel)]',
      elevated: 'bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-panel)]',
      subtle: 'bg-[var(--ds-color-surface-subtle)]',
    },
  },
});

export interface PanelProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof panelStyles> {
  readonly children: ReactNode;
}

export function Panel({ children, className, tone, ...props }: PanelProps) {
  return (
    <section className={cn(panelStyles({ tone }), className)} {...props}>
      {children}
    </section>
  );
}

export interface SurfaceRootProps extends HTMLAttributes<HTMLElement> {
  readonly children: ReactNode;
  readonly size?: 'content' | 'popup' | 'sidebar';
}

export function SurfaceRoot({ children, className, size = 'content', ...props }: SurfaceRootProps) {
  const widthClass =
    size === 'popup' ? ds.layout.popupWidth : size === 'sidebar' ? ds.layout.sidebarWidth : ds.layout.contentWidth;

  return (
    <main className={cn('min-h-screen bg-[var(--ds-color-background)] text-[color:var(--ds-color-text)]', className)} {...props}>
      <div className={cn('mx-auto w-full', widthClass)}>{children}</div>
    </main>
  );
}

export interface PageHeaderProps {
  readonly actions?: ReactNode;
  readonly eyebrow?: string;
  readonly icon?: LucideIcon;
  readonly subtitle?: string;
  readonly title: string;
}

export function PageHeader({ actions, eyebrow, icon: Icon, subtitle, title }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-[var(--ds-space-3)] border-b border-[color:var(--ds-color-border)] px-[var(--ds-space-4)] py-[var(--ds-space-4)]">
      <div className="flex min-w-0 items-center gap-[var(--ds-space-3)]">
        {Icon === undefined ? null : (
          <div className={cn('grid shrink-0 place-items-center bg-[var(--ds-color-surface-subtle)]', ds.border.default, ds.radius.lg, 'h-[var(--ds-icon-tile)] w-[var(--ds-icon-tile)]')}>
            <Icon aria-hidden="true" className={cn(ds.icon.md, ds.color.accent)} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow === undefined ? null : <p className={cn(ds.text.label, ds.color.muted)}>{eyebrow}</p>}
          <h1 className={cn('truncate', ds.text.title, ds.color.heading)}>{title}</h1>
          {subtitle === undefined ? null : <p className={cn('truncate', ds.text.caption, ds.color.caption)}>{subtitle}</p>}
        </div>
      </div>
      {actions}
    </header>
  );
}

export function SectionTitle({ icon: Icon, title }: { readonly icon?: LucideIcon; readonly title: string }) {
  return (
    <div className="flex items-center gap-[var(--ds-space-2)]">
      {Icon === undefined ? null : <Icon aria-hidden="true" className={cn(ds.icon.sm, ds.color.muted)} />}
      <h2 className={cn(ds.text.label, ds.color.muted)}>{title}</h2>
    </div>
  );
}

const badgeStyles = cva(cn('inline-flex items-center font-medium', ds.radius.sm), {
  defaultVariants: {
    intent: 'muted',
  },
  variants: {
    intent: {
      accent: 'border border-[color:var(--ds-color-accent-border)] bg-[var(--ds-color-accent-surface)] text-[color:var(--ds-color-accent)]',
      danger: 'border border-[color:var(--ds-color-danger-border)] bg-[var(--ds-color-danger-surface)] text-[color:var(--ds-color-danger)]',
      info: 'border border-[color:var(--ds-color-info-border)] bg-[var(--ds-color-info-surface)] text-[color:var(--ds-color-info)]',
      muted: 'border border-[color:var(--ds-color-border)] bg-[var(--ds-color-secondary)] text-[color:var(--ds-color-text-muted)]',
      success: 'border border-[color:var(--ds-color-success-border)] bg-[var(--ds-color-success-surface)] text-[color:var(--ds-color-success)]',
      warning: 'border border-[color:var(--ds-color-warning-border)] bg-[var(--ds-color-warning-surface)] text-[color:var(--ds-color-warning)]',
    },
  },
});

export function Badge({
  children,
  className,
  intent,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly intent?: DesignIntent;
}) {
  return <span className={cn(badgeStyles({ intent }), 'px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-label)]', className)}>{children}</span>;
}

export function KeyboardShortcut({ children }: { readonly children: ReactNode }) {
  return (
    <kbd className={cn(ds.text.mono, ds.radius.sm, ds.border.default, 'bg-[var(--ds-color-secondary)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[color:var(--ds-color-text-muted)]')}>
      {children}
    </kbd>
  );
}

export function StatusIndicator({
  intent = 'accent',
  label,
}: {
  readonly intent?: DesignIntent;
  readonly label: string;
}) {
  const colorClass = {
    accent: 'bg-[var(--ds-color-accent)]',
    danger: 'bg-[var(--ds-color-danger)]',
    info: 'bg-[var(--ds-color-info)]',
    muted: 'bg-[var(--ds-color-text-subtle)]',
    success: 'bg-[var(--ds-color-success)]',
    warning: 'bg-[var(--ds-color-warning)]',
  } satisfies Record<DesignIntent, string>;

  return (
    <span className="inline-flex items-center gap-[var(--ds-space-2)]">
      <span aria-hidden="true" className={cn('h-[var(--ds-status-dot)] w-[var(--ds-status-dot)] rounded-full', colorClass[intent])} />
      <span>{label}</span>
    </span>
  );
}

export interface ActionTileProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly description: string;
  readonly icon: LucideIcon;
  readonly meta?: string;
  readonly prominent?: boolean;
  readonly title: string;
}

export function ActionTile({
  className,
  description,
  icon: Icon,
  meta,
  prominent = false,
  title,
  ...props
}: ActionTileProps) {
  return (
    <button
      className={cn(
        'group min-h-[var(--ds-action-tile-height)] text-left transition disabled:cursor-not-allowed disabled:opacity-[var(--ds-opacity-disabled)]',
        ds.focus,
        ds.radius.lg,
        prominent
          ? 'border border-[color:var(--ds-color-accent-border)] bg-[var(--ds-color-primary)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[color:var(--ds-color-text-inverse)] shadow-[var(--ds-shadow-accent)] hover:bg-[var(--ds-color-primary-hover)]'
          : 'border border-[color:var(--ds-color-border)] bg-[var(--ds-color-panel)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[color:var(--ds-color-text)] hover:border-[color:var(--ds-color-border-strong)] hover:bg-[var(--ds-color-hover)]',
        className,
      )}
      type="button"
      {...props}
    >
      <div className="flex items-center justify-between gap-[var(--ds-space-2)]">
        <Icon aria-hidden="true" className={cn(ds.icon.md, prominent ? ds.color.inverse : ds.color.accent)} />
        {meta === undefined ? null : <span className={cn(ds.text.label, prominent ? 'text-zinc-700' : ds.color.muted)}>{meta}</span>}
      </div>
      <div className={cn('mt-[var(--ds-space-2)] truncate', ds.text.title)}>{title}</div>
      <p className={cn('mt-[var(--ds-space-1)] line-clamp-1', ds.text.caption, prominent ? 'text-zinc-800' : ds.color.caption)}>
        {description}
      </p>
    </button>
  );
}

export interface CompactActionRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: LucideIcon;
  readonly title: string;
}

export function CompactActionRow({ className, icon: Icon, title, ...props }: CompactActionRowProps) {
  return (
    <button
      className={cn(
        'flex h-[var(--ds-control-sm)] min-w-0 items-center gap-[var(--ds-space-2)] px-[var(--ds-space-2)] text-left transition disabled:cursor-not-allowed disabled:opacity-[var(--ds-opacity-disabled)]',
        ds.focus,
        ds.radius.md,
        ds.text.caption,
        'text-[color:var(--ds-color-text-muted)] hover:bg-[var(--ds-color-hover)] hover:text-[color:var(--ds-color-text)]',
        className,
      )}
      type="button"
      {...props}
    >
      <Icon aria-hidden="true" className={cn('shrink-0', ds.icon.sm, ds.color.muted)} />
      <span className="truncate">{title}</span>
    </button>
  );
}

export function MetricRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-[var(--ds-space-3)]', ds.text.body)}>
      <span className={cn('truncate', ds.color.caption)}>{label}</span>
      <span className={cn('shrink-0 font-medium', ds.color.heading)}>{value}</span>
    </div>
  );
}

export function MessageBlock({
  label,
  muted = false,
  text,
}: {
  readonly label: string;
  readonly muted?: boolean;
  readonly text: string;
}) {
  return (
    <div className={cn(ds.radius.lg, ds.border.default, muted ? 'bg-[var(--ds-color-surface-muted)]' : 'bg-[var(--ds-color-surface-subtle)]', 'p-[var(--ds-space-3)]')}>
      <div className={cn('mb-[var(--ds-space-1)]', ds.text.label, ds.color.muted)}>{label}</div>
      <p className={cn(ds.text.body, ds.color.body)}>{text}</p>
    </div>
  );
}
