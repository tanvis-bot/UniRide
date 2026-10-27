import React from 'react';
import { twMerge } from 'tailwind-merge';

const base =
'w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-ink-900 placeholder:text-slate-400 transition-colors duration-150 ease-out focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:bg-slate-50 disabled:text-slate-500';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className
}: FieldProps) {
  return (
    <div className={twMerge('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-ink-800">
        
        {label}
        {required && <span className="ml-0.5 text-signal-red">*</span>}
      </label>
      {children}
      {error ?
      <p className="text-xs font-medium text-signal-red">{error}</p> :
      hint ?
      <p className="text-xs text-slate-500">{hint}</p> :
      null}
    </div>);

}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {invalid?: boolean;}>(
  function Input({ className, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        {...rest}
        className={twMerge(base, 'h-11', invalid && 'border-signal-red', className)} />);


  });

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} {...rest} className={twMerge(base, 'h-11 pr-8', className)}>
      {children}
    </select>);

  });

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} {...rest} className={twMerge(base, 'py-2.5', className)} />;
  });