import React, { useEffect, useState } from 'react';
import { MessageSquareIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api, type ChatThread } from '../../services/api';
import { fromNow } from '../../utils/format';

export function MessagesPage() {
  const threads = useAsync(() => api.chat.threads(), []);
  const [selected, setSelected] = useState<ChatThread | null>(null);

  useEffect(() => {
    if (!selected && threads.data?.length) setSelected(threads.data[0]);
  }, [threads.data, selected]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Chat is only open between a driver and passengers with a confirmed booking on the same ride." />
      

      {threads.loading ?
      <LoadingState label="Loading conversations…" /> :
      threads.error ?
      <ErrorState message={threads.error} onRetry={threads.refetch} /> :
      (threads.data ?? []).length === 0 ?
      <EmptyState
        icon={<MessageSquareIcon className="h-5 w-5" aria-hidden />}
        title="No conversations yet"
        description="Once a booking is confirmed, you and the other person can message here." /> :


      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card padded={false} className="overflow-hidden">
            <ul className="scrollbar-thin max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
              {threads.data!.map((thread) => {
              const active =
              selected?.ride_id === thread.ride_id &&
              selected?.participant.id === thread.participant.id;
              return (
                <li key={`${thread.ride_id}-${thread.participant.id}`}>
                    <button
                    type="button"
                    onClick={() => setSelected(thread)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out ${
                    active ? 'bg-brand-50' : 'hover:bg-slate-50'}`
                    }>
                    
                      <Avatar
                      name={thread.participant.full_name}
                      src={thread.participant.avatar_url}
                      size="sm" />
                    
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-ink-900">
                            {thread.participant.full_name}
                          </p>
                          {thread.unread > 0 &&
                        <span className="rounded-full bg-signal-red px-1.5 py-0.5 text-[11px] font-bold text-white">
                              {thread.unread}
                            </span>
                        }
                        </div>
                        <p className="truncate text-xs text-slate-500">{thread.route}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {thread.last_message ?
                        `${thread.last_message.body} · ${fromNow(thread.last_message.created_at)}` :
                        'No messages yet'}
                        </p>
                      </div>
                    </button>
                  </li>);

            })}
            </ul>
          </Card>

          {selected ?
        <ChatPanel
          key={`${selected.ride_id}-${selected.participant.id}`}
          rideId={selected.ride_id}
          participant={selected.participant}
          route={`${selected.route} · ${selected.departure}`}
          online={selected.online}
          className="h-[32rem]" /> :


        <EmptyState title="Select a conversation" />
        }
        </div>
      }
    </div>);

}