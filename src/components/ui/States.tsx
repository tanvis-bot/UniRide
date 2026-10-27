import React from 'react';
import { twMerge } from 'tailwind-merge';
import { AlertTriangleIcon, Loader2Icon } from 'lucide-react';
import { Button } from './Button';

export function Spinner({ className }: {className?: string;}) {
  return (
    <Loader2Icon
      className={twMerge('h-5 w-5 animate-spin text-brand-600', className)}
      aria-hidden />);


}

export function LoadingState({ label = 'Loading…' }: {label?: string;}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      
      <Spinner className="h-6 w-6" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>);

}

export function EmptyState({
  icon,
  title,
  description,
  action





}: {icon?: React.ReactNode;title: string;description?: string;action?: React.ReactNode;}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icon &&
      <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
      }
      <h3 className="font-display text-base font-bold text-ink-900">{title}</h3>
      {description &&
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
      }
      {action && <div className="mt-3">{action}</div>}
    </div>);

}

export function ErrorState({
  message,
  onRetry



}: {message: string;onRetry?: () => void;}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
      
      <AlertTriangleIcon className="h-6 w-6 text-signal-red" aria-hidden />
      <p className="text-sm font-semibold text-rose-800">{message}</p>
      {onRetry &&
      <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      }
    </div>);

}

export function Skeleton({ className }: {className?: string;}) {
  return (
    <div
      className={twMerge('animate-pulse rounded-lg bg-slate-200/80', className)}
      aria-hidden />);


}