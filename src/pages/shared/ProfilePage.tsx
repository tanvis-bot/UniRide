import React, { useState } from 'react';
import { toast } from 'sonner';
import { StarIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input } from '../../components/ui/Field';
import { Badge, StatusPill } from '../../components/ui/Status';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { formatLongDay } from '../../utils/format';

export function ProfilePage() {
  const {
  user,
  verification,
  refresh,
  logout
} = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? ''
  });
  const [passwords, setPasswords] = useState({
    current_password: '',
    password: '',
    confirm_password: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await api.users.updateProfile(profile);
      await refresh();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await api.users.changePassword(passwords);
      toast.success(
  'Password changed. Please log in again.'
);

setPasswords({
  current_password: '',
  password: '',
  confirm_password: ''
});

logout();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account details, verification state and password." />
      

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={user.full_name} src={user.avatar_url} size="lg" />
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink-900">
                {user.full_name}
              </h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="info" className="capitalize">
                  {user.role}
                </Badge>
                <StatusPill status={user.status} />
                {user.rating > 0 &&
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    {user.rating.toFixed(1)}
                  </span>
                }
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Member since
              </dt>
              <dd className="mt-0.5 font-semibold text-ink-900">
                {formatLongDay(user.created_at.slice(0, 10))}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Trips completed
              </dt>
              <dd className="mt-0.5 font-semibold text-ink-900">{user.total_trips}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Student verification</span>
            <StatusPill status={verification.student} />
          </div>
          {user.role === 'driver' &&
          <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Driver verification</span>
              <StatusPill status={verification.driver} />
            </div>
          }
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account details" />
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Full name" htmlFor="full_name" required>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                required />
              
            </Field>
            <Field label="Phone" htmlFor="phone" required>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                required />
              
            </Field>
            <Field label="Email" htmlFor="email" hint="Contact support to change your email">
              <Input id="email" value={user.email} disabled />
            </Field>
            <Button type="submit" loading={savingProfile}>
              Save changes
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Change password"
            description="Passwords are hashed with bcrypt and never returned by the API." />
          
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="Current password" htmlFor="current_password" required>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                value={passwords.current_password}
                onChange={(e) =>
                setPasswords({ ...passwords, current_password: e.target.value })
                }
                required />
              
            </Field>
            <Field label="New password" htmlFor="new_password" hint="Minimum 8 characters" required>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                value={passwords.password}
                onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                required />
              
            </Field>
            <Field label="Confirm new password" htmlFor="confirm_new" required>
              <Input
                id="confirm_new"
                type="password"
                autoComplete="new-password"
                value={passwords.confirm_password}
                onChange={(e) =>
                setPasswords({ ...passwords, confirm_password: e.target.value })
                }
                required />
              
            </Field>
            <Button type="submit" loading={savingPassword}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>);

}