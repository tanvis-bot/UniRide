import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Loader2Icon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
  'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-sm',
  secondary:
  'bg-white text-ink-800 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-ink-700',
  ghost: 'bg-transparent text-ink-700 hover:bg-slate-100 focus-visible:outline-ink-700',
  danger: 'bg-signal-red text-white hover:bg-rose-700 focus-visible:outline-signal-red',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 focus-visible:outline-ink-900'
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2'
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  block = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={twMerge(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className
      )}>
      
      {loading ?
      <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> :

      icon
      }
      {children}
    </button>);

}