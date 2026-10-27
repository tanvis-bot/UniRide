import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState } from
'react';
import { toast } from 'sonner';
import type { AppNotification } from '../types';
import { api } from '../services/api';
import { socket } from '../server/socket';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: AppNotification[];
  unread: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  reload: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: {children: React.ReactNode;}) {
  const { status, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(() => {
    if (status !== 'authenticated') {
      setNotifications([]);
      return;
    }
    setLoading(true);
    api.notifications.
    list().
    then(setNotifications).
    catch(() => setNotifications([])).
    finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    reload();
  }, [reload, user?.id]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    return socket.on('notification', (payload: AppNotification) => {
      if (payload.user_id !== user?.id) return;
      setNotifications((prev) => [payload, ...prev]);
      toast(payload.title, { description: payload.body });
    });
  }, [status, user?.id]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
    prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    );
    await api.notifications.read(id).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await api.notifications.readAll().catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unread: notifications.filter((n) => !n.is_read).length,
      loading,
      markRead,
      markAllRead,
      reload
    }),
    [notifications, loading, markRead, markAllRead, reload]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>);

}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}