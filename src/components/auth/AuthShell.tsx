import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { Logo } from '../layout/Logo';

interface AuthShellProps {
  image: string;
  imageAlt: string;
  quote: string;
  quoteBy: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({
  image,
  imageAlt,
  quote,
  quoteBy,
  title,
  subtitle,
  children,
  footer
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden isolate overflow-hidden bg-ink-950 lg:block">
        <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,13,24,0.55)_0%,rgba(7,13,24,0.9)_100%)]" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo tone="light" />
          <figure>
            <blockquote className="max-w-md font-display text-2xl font-bold leading-snug text-white">
              “{quote}”
            </blockquote>
            <figcaption className="mt-4 text-sm text-slate-300">{quoteBy}</figcaption>
          </figure>
        </div>
      </div>

      <div className="flex flex-col bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 lg:border-0">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors duration-150 ease-out hover:text-ink-900">
            
            <ArrowLeftIcon className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
              {title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm text-slate-600">{footer}</div>}
          </div>
        </div>
      </div>
    </div>);

}