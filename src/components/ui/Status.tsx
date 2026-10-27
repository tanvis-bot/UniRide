import React from 'react';
import { twMerge } from 'tailwind-merge';
import { BadgeCheckIcon } from 'lucide-react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-brand-50 text-brand-700 ring-brand-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
  brand: 'bg-ink-900 text-white ring-ink-900'
};

export function Badge({
  tone = 'neutral',
  className,
  children




}: {tone?: Tone;className?: string;children: React.ReactNode;}) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className
      )}>
      
      {children}
    </span>);

}

const statusTone: Record<string, Tone> = {
  approved: 'success',
  confirmed: 'success',
  completed: 'info',
  active: 'success',
  scheduled: 'info',
  pending: 'warning',
  not_submitted: 'neutral',
  draft: 'neutral',
  rejected: 'danger',
  cancelled: 'danger',
  suspended: 'danger',
  deactivated: 'neutral'
};

export function StatusPill({ status }: {status: string;}) {
  const label = status.replace(/_/g, ' ');
  return (
    <Badge tone={statusTone[status] ?? 'neutral'} className="capitalize">
      {label}
    </Badge>);

}

export function VerifiedBadge({ verified }: {verified: boolean;}) {
  if (!verified)
  return (
    <Badge tone="warning">
        Unverified
      </Badge>);

  return (
    <Badge tone="success">
      <BadgeCheckIcon className="h-3.5 w-3.5" aria-hidden />
      Verified
    </Badge>);

}