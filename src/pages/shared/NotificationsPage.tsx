import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckCheckIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { useNotifications } from '../../contexts/NotificationContext';
import { fromNow } from '../../utils/format';

export function NotificationsPage() {
  const { notifications, unread, loading, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
        unread ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You are up to date.'
        }
        action={
        unread > 0 ?
        <Button
          variant="secondary"
          icon={<CheckCheckIcon className="h-4 w-4" aria-hidden />}
          onClick={() => markAllRead()}>
          
              Mark all read
            </Button> :
        null
        } />
      

      {loading ?
      <LoadingState label="Loading notifications…" /> :
      notifications.length === 0 ?
      <EmptyState
        icon={<BellIcon className="h-5 w-5" aria-hidden />}
        title="Nothing here yet"
        description="Booking updates, verification decisions and ride alerts appear on this page." /> :


      <Card padded={false}>
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) =>
          <li key={n.id}>
                <button
              type="button"
              onClick={() => {
                markRead(n.id);
                if (n.link) navigate(n.link);
              }}
              className={`flex w-full items-start gap-3 px-5 py-4 text-left transition-colors duration-150 ease-out hover:bg-slate-50 ${
              n.is_read ? '' : 'bg-brand-50/40'}`
              }>
              
                  <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                n.is_read ? 'bg-slate-300' : 'bg-brand-500'}`
                }
                aria-hidden />
              
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink-900">
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-600">{n.body}</span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {fromNow(n.created_at)}
                    </span>
                  </span>
                </button>
              </li>
          )}
          </ul>
        </Card>
      }
    </div>);

}