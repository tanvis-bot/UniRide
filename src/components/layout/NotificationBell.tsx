import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon, CheckCheckIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../contexts/NotificationContext';

export function NotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-700 transition-colors duration-150 ease-out hover:bg-slate-50">
        
        <BellIcon className="h-5 w-5" aria-hidden />
        {unread > 0 &&
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-signal-red px-1 text-[11px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        }
      </button>

      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
          
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="font-display text-sm font-bold text-ink-900">
                Notifications
              </p>
              {unread > 0 &&
            <button
              type="button"
              onClick={() => markAllRead()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
              
                  <CheckCheckIcon className="h-3.5 w-3.5" aria-hidden />
                  Mark all read
                </button>
            }
            </div>
            <ul className="scrollbar-thin max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {notifications.length === 0 &&
            <li className="px-4 py-10 text-center text-sm text-slate-500">
                  You have no notifications yet.
                </li>
            }
              {notifications.slice(0, 12).map((n) =>
            <li key={n.id}>
                  <button
                type="button"
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                  if (n.link) navigate(n.link);
                }}
                className={`flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-slate-50 ${
                n.is_read ? '' : 'bg-brand-50/50'}`
                }>
                
                    <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  n.is_read ? 'bg-slate-300' : 'bg-brand-500'}`
                  }
                  aria-hidden />
                
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink-900">
                        {n.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true
                    })}
                      </span>
                    </span>
                  </button>
                </li>
            )}
            </ul>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}