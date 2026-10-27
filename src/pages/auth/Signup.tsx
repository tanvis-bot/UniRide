import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircleIcon, CarFrontIcon, UserIcon } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { dashboardPath, useAuth } from '../../contexts/AuthContext';
import { errorMessage } from '../../services/http';
import { IMAGES } from '../../data/seed';

type Role = 'passenger' | 'driver';

const roleOptions: Array<{value: Role;label: string;body: string;icon: React.ElementType;}> = [
{
  value: 'passenger',
  label: 'Passenger',
  body: 'Book seats on rides going your way.',
  icon: UserIcon
},
{
  value: 'driver',
  label: 'Driver',
  body: 'Publish your commute and share costs.',
  icon: CarFrontIcon
}];


export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'passenger' as Role
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await signup(form);
      toast.success('Account created. Welcome to UniRide.');
      navigate(dashboardPath[user.role], { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      image={IMAGES.signup}
      imageAlt="Students with backpacks beside a car on a campus street"
      quote="Verification takes a day. After that, every ride you book or publish carries the badge."
      quoteBy="UniRide trust & safety"
      title="Create your account"
      subtitle="Join as a passenger or apply to drive. Admin accounts are issued internally."
      footer={
      <p>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      }>
      
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error &&
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
          
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        }

        <Field label="Full name" htmlFor="full_name" required>
          <Input
            id="full_name"
            autoComplete="name"
            placeholder="Priya Nair"
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            required />
          
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required />
            
          </Field>
          <Field label="Phone" htmlFor="phone" required>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              required />
            
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" hint="Minimum 8 characters" required>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required />
            
          </Field>
          <Field label="Confirm password" htmlFor="confirm_password" required>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(e) => update('confirm_password', e.target.value)}
              required />
            
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-ink-800">I am joining as</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const active = form.role === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors duration-150 ease-out ${
                  active ?
                  'border-brand-500 bg-brand-50 ring-1 ring-brand-500' :
                  'border-slate-300 hover:border-slate-400'}`
                  }>
                  
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={active}
                    onChange={() => update('role', option.value)}
                    className="sr-only" />
                  
                  <Icon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${active ? 'text-brand-700' : 'text-slate-400'}`}
                    aria-hidden />
                  
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {option.body}
                    </span>
                  </span>
                </label>);

            })}
          </div>
        </fieldset>

        <p className="text-xs leading-relaxed text-slate-500">
          By creating an account you agree to the{' '}
          <Link to="/terms" className="font-medium text-brand-700 hover:underline">
            Terms of Use
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="font-medium text-brand-700 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <Button type="submit" block size="lg" loading={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>);

}