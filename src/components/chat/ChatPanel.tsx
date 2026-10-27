import React, { useEffect, useRef, useState } from 'react';
import { SendIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { ChatMessage, PublicUser } from '../../types';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { socket } from '../../server/socket';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { LoadingState } from '../ui/States';

interface ChatPanelProps {
  rideId: string;
  participant: PublicUser;
  route: string;
  online?: boolean;
  className?: string;
}

export function ChatPanel({
  rideId,
  participant,
  route,
  online = false,
  className = ''
}: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    api.chat.
    messages(rideId, participant.id).
    then((data) => {
      setMessages(data);
      setError(null);
    }).
    catch((err) => setError(errorMessage(err))).
    finally(() => setLoading(false));
  }, [rideId, participant.id]);

  useEffect(
    () =>
    socket.on('chat:message', (message: ChatMessage) => {
      if (message.ride_id !== rideId) return;
      if (![message.sender_id, message.receiver_id].includes(participant.id)) return;
      setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message]
      );
    }),
    [rideId, participant.id]
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const message = await api.chat.send(rideId, participant.id, draft);
      setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message]
      );
      setDraft('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}>
      
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <Avatar name={participant.full_name} src={participant.avatar_url} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">
            {participant.full_name}
          </p>
          <p className="truncate text-xs text-slate-500">{route}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          online ? 'text-brand-700' : 'text-slate-400'}`
          }>
          
          <span
            className={`h-2 w-2 rounded-full ${online ? 'bg-brand-500' : 'bg-slate-300'}`}
            aria-hidden />
          
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      <div
        ref={listRef}
        className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
        
        {loading ?
        <LoadingState label="Loading conversation…" /> :
        messages.length === 0 ?
        <p className="py-10 text-center text-sm text-slate-500">
            No messages yet. Say hello and confirm the pickup point.
          </p> :

        messages.map((message) => {
          const mine = message.sender_id === user?.id;
          return (
            <div
              key={message.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              
                <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                mine ?
                'bg-brand-600 text-white' :
                'border border-slate-200 bg-white text-ink-800'}`
                }>
                
                  <p className="text-sm leading-relaxed">{message.body}</p>
                  <p
                  className={`mt-1 text-[11px] ${
                  mine ? 'text-brand-100' : 'text-slate-400'}`
                  }>
                  
                    {format(new Date(message.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>);

        })
        }
      </div>

      {error &&
      <p role="alert" className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error}
        </p>
      }

      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message" />
        
        <Button
          type="submit"
          loading={sending}
          disabled={!draft.trim()}
          icon={<SendIcon className="h-4 w-4" aria-hidden />}>
          
          Send
        </Button>
      </form>
    </div>);

}