import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
          {title}
        </h1>
        {description &&
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
        }
      </div>
      {action}
    </div>);

}