import React from 'react';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg'
};

function initials(name: string): string {
  return name.
  split(' ').
  filter(Boolean).
  slice(0, 2).
  map((part) => part[0]?.toUpperCase()).
  join('');
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={twMerge(
          'shrink-0 rounded-full object-cover ring-1 ring-slate-200',
          sizes[size],
          className
        )} />);


  }
  return (
    <span
      aria-hidden
      className={twMerge(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-ink-800 font-semibold text-white ring-1 ring-ink-700',
        sizes[size],
        className
      )}>
      
      {initials(name) || 'U'}
    </span>);

}