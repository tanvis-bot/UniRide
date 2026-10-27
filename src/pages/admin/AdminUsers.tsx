import React, { useState } from 'react';
import { toast } from 'sonner';
import { SearchIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { Badge, StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api, type AdminUserRow } from '../../services/api';
import { errorMessage } from '../../services/http';
import { formatDay } from '../../utils/format';

interface AdminUsersProps {
  lockedRole?: 'driver' | 'passenger';
  title?: string;
  description?: string;
}

export function AdminUsers({ lockedRole, title, description }: AdminUsersProps) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>(lockedRole ?? 'all');
  const [status, setStatus] = useState('all');
  const [applied, setApplied] = useState({ q: '', role: lockedRole ?? 'all', status: 'all' });
  const [target, setTarget] = useState<{user: AdminUserRow;status: string;} | null>(null);

  const users = useAsync(() => api.admin.users(applied), [JSON.stringify(applied)]);

  async function changeStatus() {
    if (!target) return;
    try {
      await api.admin.setUserStatus(target.user.id, target.status);
      toast.success(`${target.user.full_name} is now ${target.status}.`);
      users.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title ?? 'User management'}
        description={
        description ?? 'Search accounts, review verification state and control access.'
        } />
      

      <Card>
        <form
          className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ q, role, status });
          }}>
          
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden />
            
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search users"
              className="pl-9" />
            
          </div>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filter by role"
            disabled={!!lockedRole}>
            
            <option value="all">All roles</option>
            <option value="passenger">Passengers</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status">
            
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </Select>
          <Button type="submit">Filter</Button>
        </form>
      </Card>

      {users.loading ?
      <LoadingState label="Loading users…" /> :
      users.error ?
      <ErrorState message={users.error} onRetry={users.refetch} /> :
      (users.data ?? []).length === 0 ?
      <EmptyState
        icon={<UsersIcon className="h-5 w-5" aria-hidden />}
        title="No users match this filter"
        description="Try a different search term, role or status." /> :


      <Card padded={false} className="overflow-hidden">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Email</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Verification</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.data!.map((user) =>
              <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                        <span className="font-semibold text-ink-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{user.email}</td>
                    <td className="px-5 py-4 capitalize text-slate-600">{user.role}</td>
                    <td className="px-5 py-4">
                      {user.role === 'driver' ?
                  <Badge tone={user.driver_verified ? 'success' : 'warning'}>
                          {user.driver_verified ? 'Driver verified' : 'Not verified'}
                        </Badge> :
                  user.role === 'passenger' ?
                  <Badge tone={user.student_verified ? 'success' : 'neutral'}>
                          {user.student_verified ? 'Student verified' : 'No student ID'}
                        </Badge> :

                  <span className="text-slate-400">—</span>
                  }
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={user.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDay(user.created_at.slice(0, 10))}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {user.status !== 'active' &&
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setTarget({ user, status: 'active' })}>
                      
                            Activate
                          </Button>
                    }
                        {user.status === 'active' &&
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setTarget({ user, status: 'suspended' })}>
                      
                            Suspend
                          </Button>
                    }
                        {user.status !== 'deactivated' &&
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-signal-red hover:bg-rose-50"
                      onClick={() => setTarget({ user, status: 'deactivated' })}>
                      
                            Deactivate
                          </Button>
                    }
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 lg:hidden">
            {users.data!.map((user) =>
          <li key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">{user.full_name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <StatusPill status={user.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="info" className="capitalize">
                    {user.role}
                  </Badge>
                  {user.role === 'driver' &&
              <Badge tone={user.driver_verified ? 'success' : 'warning'}>
                      {user.driver_verified ? 'Verified' : 'Unverified'}
                    </Badge>
              }
                  <span className="text-xs text-slate-500">
                    Joined {formatDay(user.created_at.slice(0, 10))}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.status === 'active' ?
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setTarget({ user, status: 'suspended' })}>
                
                      Suspend
                    </Button> :

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setTarget({ user, status: 'active' })}>
                
                      Activate
                    </Button>
              }
                </div>
              </li>
          )}
          </ul>
        </Card>
      }

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={`Set account to ${target?.status ?? ''}?`}
        description={
        target ?
        `${target.user.full_name} will ${
        target.status === 'active' ?
        'regain access to UniRide.' :
        'be blocked from signing in until the status is changed back.'}` :

        ''
        }
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
            variant={target?.status === 'active' ? 'primary' : 'danger'}
            onClick={changeStatus}>
            
              Confirm
            </Button>
          </>
        } />
      
    </div>);

}