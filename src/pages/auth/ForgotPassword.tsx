import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2Icon } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { IMAGES } from '../../data/seed';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setSent(true);
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
      quote="Account recovery never reveals whether an email is registered — that check happens server side."
      quoteBy="UniRide security"
      title="Reset your password"
      subtitle="Enter the email on your account and we will send a reset link."
      footer={
      <p>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Back to login
          </Link>
        </p>
      }>
      
      {sent ?
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <CheckCircle2Icon className="h-6 w-6 text-brand-700" aria-hidden />
          <h2 className="mt-3 font-display text-base font-bold text-ink-900">
            Check your inbox
          </h2>
          <p className="mt-1.5 text-sm text-ink-700">
            If an account exists for <strong>{email}</strong>, a reset link is on
            its way. The link expires in 15 minutes.
          </p>
          <Button
          className="mt-5"
          onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}>
          
            Continue to reset
          </Button>
        </div> :

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="email" error={error ?? undefined} required>
            <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required />
          
          </Field>
          <Button type="submit" block size="lg" loading={submitting}>
            {submitting ? 'Sending link…' : 'Send reset link'}
          </Button>
        </form>
      }
    </AuthShell>);

}