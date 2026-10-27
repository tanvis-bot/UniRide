import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircleIcon } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { IMAGES } from '../../data/seed';

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: params.get('email') ?? '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.resetPassword(form);
      toast.success('Password updated. Sign in with your new password.');
      navigate('/login', { replace: true });
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
      quote="Passwords are stored as bcrypt hashes and never returned by any endpoint."
      quoteBy="UniRide security"
      title="Choose a new password"
      subtitle="Set a new password for your UniRide account."
      footer={
      <p>
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Back to login
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
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required />
          
        </Field>
        <Field label="New password" htmlFor="password" hint="Minimum 8 characters" required>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required />
          
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" required>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            required />
          
        </Field>
        <Button type="submit" block size="lg" loading={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>);

}