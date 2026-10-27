import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { dashboardPath, useAuth } from '../../contexts/AuthContext';
import { errorMessage } from '../../services/http';
import { DEMO_ACCOUNTS, IMAGES } from '../../data/seed';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as {state?: {from?: string;};};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password, remember);
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}.`);
      const from = location.state?.from;
      const target =
      from && from.startsWith(`/${user.role}`) ? from : dashboardPath[user.role];
      navigate(target, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      image={IMAGES.login}
      imageAlt="City road at night with car light trails"
      quote="Three of us leave the same suburb at the same time every morning. UniRide just made that official."
      quoteBy="Priya Nair · Computer Engineering"
      title="Welcome back"
      subtitle="Sign in to book a seat, manage your rides or review verifications."
      footer={
      <p>
          New to UniRide?{' '}
          <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800">
            Create an account
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

        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required />
          
        </Field>

        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
              required />
            
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-ink-800">
              
              {showPassword ?
              <EyeOffIcon className="h-4 w-4" /> :

              <EyeIcon className="h-4 w-4" />
              }
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            
            Forgot password?
          </Link>
        </div>

        <Button type="submit" block size="lg" loading={submitting}>
          {submitting ? 'Signing in…' : 'Login'}
        </Button>
      </form>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Demo accounts
        </p>
        <ul className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((account) =>
          <li key={account.email} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {account.label} · {account.email}
                </p>
                <p className="text-xs text-slate-500">{account.password}</p>
              </div>
              <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
              }}>
              
                Use
              </Button>
            </li>
          )}
        </ul>
      </div>
    </AuthShell>);

}