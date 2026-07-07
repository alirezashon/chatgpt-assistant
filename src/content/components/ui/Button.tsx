import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  readonly variant?: ButtonVariant;
}

const BUTTON_VARIANT_CLASS_NAMES: Readonly<Record<ButtonVariant, string>> = {
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-200 disabled:bg-red-500',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-200',
  primary:
    'bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-300 disabled:bg-slate-700',
  secondary:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-200',
};

export function Button({
  children,
  className = '',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition duration-200 ease-out focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        BUTTON_VARIANT_CLASS_NAMES[variant],
        className,
      ].join(' ')}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
