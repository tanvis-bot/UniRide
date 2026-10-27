import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article';
  padded?: boolean;
}

export function Card({
  as: Tag = 'div',
  padded = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={twMerge(
        'rounded-2xl border border-slate-200 bg-white shadow-card',
        padded && 'p-5',
        className
      )}>
      
      {children}
    </Tag>);

}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div
      className={twMerge(
        'flex flex-wrap items-start justify-between gap-3 pb-4',
        className
      )}>
      
      <div>
        <h2 className="font-display text-base font-bold text-ink-900">{title}</h2>
        {description &&
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        }
      </div>
      {action}
    </div>);

}