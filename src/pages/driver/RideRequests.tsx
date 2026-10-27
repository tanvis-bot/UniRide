import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon, InboxIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge, StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { currency, formatDay, formatTime, fromNow } from '../../utils/format';

const tabs = [
{ key: 'pending', label: 'Pending' },
{ key: 'confirmed', label: 'Confirmed' },
{ key: 'other', label: 'Rejected & cancelled' }] as
const;

export function RideRequests() {
  const requests = useAsync(() => api.bookings.requests(), []);
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const rows = (requests.data ?? []).filter((r) => {
    if (tab === 'other') return ['rejected', 'cancelled'].includes(r.status);
    if (tab === 'confirmed') return ['confirmed', 'completed'].includes(r.status);
    return r.status === 'pending';
  });

  async function decide(id: string, decision: 'accept' | 'reject') {
    setBusy(id);
    try {
      await api.bookings.decide(id, decision);
      toast.success(decision === 'accept' ? 'Booking confirmed.' : 'Booking rejected.');
      requests.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ride requests"
        description="Accept or decline passengers. Fares are recalculated for everyone when the passenger count changes." />
      

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {tabs.map((item) =>
        <button
          key={item.key}
          onClick={() => setTab(item.key)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 ease-out ${
          tab === item.key ? 'bg-ink-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
          }>
          
            {item.label}
          </button>
        )}
      </div>

      {requests.loading ?
      <LoadingState label="Loading requests…" /> :
      requests.error ?
      <ErrorState message={requests.error} onRetry={requests.refetch} /> :
      rows.length === 0 ?
      <EmptyState
        icon={<InboxIcon className="h-5 w-5" aria-hidden />}
        title="Nothing in this list"
        description="Booking requests arrive here in real time as passengers reserve seats." /> :


      <ul className="space-y-4">
          {rows.map((request) =>
        <li key={request.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                  name={request.passenger.full_name}
                  src={request.passenger.avatar_url} />
                
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-base font-bold text-ink-900">
                          {request.passenger.full_name}
                        </p>
                        {request.student_verified &&
                    <Badge tone="success">Student verified</Badge>
                    }
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {request.ride.source} → {request.ride.destination} ·{' '}
                        {formatDay(request.ride.departure_date)} ·{' '}
                        {formatTime(request.ride.departure_time)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Requested {fromNow(request.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusPill status={request.status} />
                    <p className="mt-2 font-display text-xl font-extrabold text-ink-900">
                      {currency(request.final_fare)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {request.seats} seat{request.seats > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {request.status === 'pending' &&
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Button
                size="sm"
                loading={busy === request.id}
                icon={<CheckIcon className="h-4 w-4" aria-hidden />}
                onClick={() => decide(request.id, 'accept')}>
                
                      Accept request
                    </Button>
                    <Button
                size="sm"
                variant="secondary"
                icon={<XIcon className="h-4 w-4" aria-hidden />}
                onClick={() => decide(request.id, 'reject')}>
                
                      Reject
                    </Button>
                  </div>
            }
              </Card>
            </li>
        )}
        </ul>
      }
    </div>);

}