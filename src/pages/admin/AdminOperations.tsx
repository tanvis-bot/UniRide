import React, { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardListIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { currency, fromNow } from '../../utils/format';

interface Props {
  view: 'bookings' | 'reports' | 'issues';
}

const titles = {
  bookings: {
    title: 'Bookings',
    description: 'Every seat booked on the platform with its fare and status.'
  },
  reports: {
    title: 'Reports',
    description: 'Verification, ride and booking volumes used for platform reporting.'
  },
  issues: {
    title: 'Reported issues & SOS',
    description: 'User reports and emergency incidents raised during trips.'
  }
};

export function AdminOperations({ view }: Props) {
  const [status, setStatus] = useState('all');
  const bookings = useAsync(
    () => view === 'issues' ? Promise.resolve([]) : api.admin.bookings({ status }),
    [view, status]
  );
  const issues = useAsync(
    () => view === 'issues' ? api.admin.issues() : Promise.resolve({ issues: [], sos: [] }),
    [view]
  );
  const stats = useAsync(
    () => view === 'reports' ? api.admin.stats() : Promise.resolve(null as any),
    [view]
  );

  async function resolveIssue(id: string) {
    try {
      await api.admin.updateIssue(id, 'resolved');
      toast.success('Issue marked resolved.');
      issues.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const copy = titles[view];

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        action={
        view === 'bookings' ?
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter bookings by status"
          className="w-44">
          
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </Select> :
        null
        } />
      

      {view === 'reports' &&
      <>
          {stats.loading ?
        <LoadingState label="Building report…" /> :
        stats.error || !stats.data ?
        <ErrorState message={stats.error ?? 'Unable to load report.'} onRetry={stats.refetch} /> :

        <Card>
              <CardHeader title="Platform totals" />
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(stats.data.totals).map(([key, value]) =>
            <div key={key} className="rounded-xl border border-slate-200 p-4">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-extrabold text-ink-900">
                      {value as number}
                    </dd>
                  </div>
            )}
              </dl>
            </Card>
        }
        </>
      }

      {view === 'bookings' &&
      <>
          {bookings.loading ?
        <LoadingState label="Loading bookings…" /> :
        bookings.error ?
        <ErrorState message={bookings.error} onRetry={bookings.refetch} /> :
        (bookings.data ?? []).length === 0 ?
        <EmptyState
          icon={<ClipboardListIcon className="h-5 w-5" aria-hidden />}
          title="No bookings match this filter" /> :


        <Card padded={false} className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Booking</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Route</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Passenger</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Driver</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Fare</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.data!.map((row: any) =>
                <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-ink-900">{row.id}</td>
                        <td className="px-5 py-4 text-slate-600">{row.route}</td>
                        <td className="px-5 py-4 text-slate-600">
                          {row.passenger.full_name}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{row.driver.full_name}</td>
                        <td className="px-5 py-4 font-semibold text-ink-900">
                          {currency(row.final_fare)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusPill status={row.status} />
                        </td>
                      </tr>
                )}
                  </tbody>
                </table>
              </div>
            </Card>
        }
        </>
      }

      {view === 'issues' &&
      <>
          {issues.loading ?
        <LoadingState label="Loading reports…" /> :
        issues.error ?
        <ErrorState message={issues.error} onRetry={issues.refetch} /> :

        <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Reported issues" />
                {issues.data!.issues.length === 0 ?
            <EmptyState title="No open reports" /> :

            <ul className="divide-y divide-slate-100">
                    {issues.data!.issues.map((issue: any) =>
              <li key={issue.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink-900">{issue.category}</p>
                            <p className="mt-0.5 text-sm text-slate-600">
                              {issue.description}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {issue.user.full_name} · {fromNow(issue.created_at)}
                            </p>
                          </div>
                          <StatusPill status={issue.status} />
                        </div>
                        {issue.status !== 'resolved' &&
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => resolveIssue(issue.id)}>
                  
                            Mark resolved
                          </Button>
                }
                      </li>
              )}
                  </ul>
            }
              </Card>

              <Card>
                <CardHeader title="SOS incidents" />
                {issues.data!.sos.length === 0 ?
            <EmptyState title="No SOS incidents" description="Nothing has been raised." /> :

            <ul className="divide-y divide-slate-100">
                    {issues.data!.sos.map((incident: any) =>
              <li key={incident.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink-900">
                              {incident.user.full_name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {incident.location ?
                      `Location ${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}` :
                      'No location attached'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {fromNow(incident.created_at)}
                            </p>
                          </div>
                          <StatusPill status={incident.status} />
                        </div>
                      </li>
              )}
                  </ul>
            }
              </Card>
            </div>
        }
        </>
      }
    </div>);

}