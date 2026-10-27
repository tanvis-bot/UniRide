import type { AppNotification, NotificationType } from '../../types';
import { db, nowIso, persist, uid } from '../db';
import { serverEmit } from '../socket';

export function createNotification(
user_id: string,
type: NotificationType,
title: string,
body: string,
link: string)
: AppNotification {
  const notification: AppNotification = {
    id: uid('n'),
    user_id,
    type,
    title,
    body,
    link,
    is_read: false,
    created_at: nowIso()
  };
  db().notifications.unshift(notification);
  persist();
  serverEmit({ user: user_id }, 'notification', notification);
  return notification;
}