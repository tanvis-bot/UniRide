import type {
  ChatMessage,
  EmergencyContact,
  ReportedIssue,
  SosIncident,
  TripShare } from
'../../types';
import { db, nowIso, persist, uid } from '../db';
import { ApiError, requireAuth, validate, type Ctx } from '../middleware/auth';
import { createNotification } from '../services/notifications';
import { toPublicUser } from '../services/users';
import { hydrate } from './rideController';
import { serverEmit } from '../socket';

/* ------------------------- notifications ------------------------- */

/** GET /api/notifications */
export function listNotifications(ctx: Ctx) {
  const auth = requireAuth(ctx);
  return db().
  notifications.filter((n) => n.user_id === auth.sub).
  sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** POST /api/notifications/:id/read */
export function readNotification(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const notification = db().notifications.find((n) => n.id === ctx.params.id);
  if (!notification || notification.user_id !== auth.sub)
  throw new ApiError(404, 'Notification not found.');
  notification.is_read = true;
  persist();
  return notification;
}

/** POST /api/notifications/read-all */
export function readAllNotifications(ctx: Ctx) {
  const auth = requireAuth(ctx);
  db().
  notifications.filter((n) => n.user_id === auth.sub).
  forEach((n) => n.is_read = true);
  persist();
  return { ok: true };
}

/* ------------------------------ chat ----------------------------- */

function assertRideParticipant(userId: string, rideId: string) {
  const ride = db().rides.find((r) => r.id === rideId);
  if (!ride) throw new ApiError(404, 'Ride not found.');
  const isDriver = ride.driver_id === userId;
  const isConfirmedPassenger = db().bookings.some(
    (b) =>
    b.ride_id === rideId &&
    b.passenger_id === userId &&
    ['confirmed', 'completed'].includes(b.status)
  );
  if (!isDriver && !isConfirmedPassenger)
  throw new ApiError(403, 'Chat is only available to people on this ride.');
  return ride;
}

/** GET /api/chat/threads */
export function chatThreads(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const rides =
  auth.role === 'driver' ?
  db().rides.filter((r) => r.driver_id === auth.sub) :
  db().
  bookings.filter(
    (b) =>
    b.passenger_id === auth.sub &&
    ['confirmed', 'completed'].includes(b.status)
  ).
  map((b) => db().rides.find((r) => r.id === b.ride_id)!);

  const threads = rides.
  filter(Boolean).
  flatMap((ride) => {
    const counterparts =
    auth.role === 'driver' ?
    db().
    bookings.filter(
      (b) =>
      b.ride_id === ride.id &&
      ['confirmed', 'completed'].includes(b.status)
    ).
    map((b) => b.passenger_id) :
    [ride.driver_id];
    return counterparts.map((otherId) => {
      const messages = db().chat_messages.filter(
        (m) =>
        m.ride_id === ride.id &&
        [m.sender_id, m.receiver_id].includes(auth.sub) &&
        [m.sender_id, m.receiver_id].includes(otherId)
      );
      const other = db().users.find((u) => u.id === otherId)!;
      return {
        ride_id: ride.id,
        route: `${ride.source} → ${ride.destination}`,
        ride_status: ride.status,
        departure: `${ride.departure_date} ${ride.departure_time}`,
        participant: toPublicUser(other),
        online: ride.status === 'active',
        unread: messages.filter((m) => m.receiver_id === auth.sub && !m.is_read).length,
        last_message: messages[messages.length - 1] ?? null
      };
    });
  }).
  sort((a, b) =>
  (b.last_message?.created_at ?? '').localeCompare(a.last_message?.created_at ?? '')
  );
  return threads;
}

/** GET /api/chat/:rideId/:userId */
export function chatMessages(ctx: Ctx) {
  const auth = requireAuth(ctx);
  assertRideParticipant(auth.sub, ctx.params.rideId);
  const other = ctx.params.userId;
  const messages = db().chat_messages.filter(
    (m) =>
    m.ride_id === ctx.params.rideId &&
    [m.sender_id, m.receiver_id].includes(auth.sub) &&
    [m.sender_id, m.receiver_id].includes(other)
  );
  messages.forEach((m) => {
    if (m.receiver_id === auth.sub) m.is_read = true;
  });
  persist();
  return messages;
}

/** POST /api/chat/:rideId */
export function sendChatMessage(ctx: Ctx) {
  const auth = requireAuth(ctx);
  assertRideParticipant(auth.sub, ctx.params.rideId);
  const { receiver_id, body } = ctx.body ?? {};
  validate([[!!body?.trim(), 'Type a message first.']]);
  assertRideParticipant(receiver_id, ctx.params.rideId);
  const message: ChatMessage = {
    id: uid('c'),
    ride_id: ctx.params.rideId,
    sender_id: auth.sub,
    receiver_id,
    body: body.trim(),
    is_read: false,
    created_at: nowIso()
  };
  db().chat_messages.push(message);
  persist();
  serverEmit({ broadcast: true }, 'chat:message', message);
  const sender = db().users.find((u) => u.id === auth.sub)!;
  createNotification(
    receiver_id,
    'chat_message',
    `New message from ${sender.full_name}`,
    message.body,
    auth.role === 'driver' ? '/passenger/messages' : '/driver/messages'
  );
  return message;
}

/* ------------------------ emergency & SOS ------------------------ */

/** GET /api/emergency */
export function listEmergencyContacts(ctx: Ctx) {
  const auth = requireAuth(ctx);
  return db().emergency_contacts.filter((c) => c.user_id === auth.sub);
}

/** POST /api/emergency */
export function addEmergencyContact(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const { name, relationship, phone } = ctx.body ?? {};
  validate([
  [!!name && name.trim().length >= 2, 'Enter the contact name.'],
  [!!relationship, 'Enter the relationship.'],
  [/^[+0-9 ()-]{8,18}$/.test(phone ?? ''), 'Enter a valid phone number.']]
  );
  const contact: EmergencyContact = {
    id: uid('ec'),
    user_id: auth.sub,
    name: name.trim(),
    relationship,
    phone,
    created_at: nowIso()
  };
  db().emergency_contacts.push(contact);
  persist();
  return contact;
}

/** DELETE /api/emergency/:id */
export function deleteEmergencyContact(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const contact = db().emergency_contacts.find((c) => c.id === ctx.params.id);
  if (!contact || contact.user_id !== auth.sub)
  throw new ApiError(404, 'Contact not found.');
  db().emergency_contacts = db().emergency_contacts.filter((c) => c.id !== contact.id);
  persist();
  return { ok: true };
}

/** POST /api/sos */
export function triggerSos(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const { ride_id = null, location = null } = ctx.body ?? {};
  const incident: SosIncident = {
    id: uid('sos'),
    user_id: auth.sub,
    ride_id,
    location,
    status: 'open',
    created_at: nowIso()
  };
  db().sos_incidents.unshift(incident);
  persist();
  const user = db().users.find((u) => u.id === auth.sub)!;
  db().
  users.filter((u) => u.role === 'admin').
  forEach((admin) =>
  createNotification(
    admin.id,
    'sos',
    'SOS triggered',
    `${user.full_name} raised an SOS alert.`,
    '/admin/issues'
  )
  );
  if (ride_id) {
    const ride = db().rides.find((r) => r.id === ride_id);
    if (ride && ride.driver_id !== auth.sub)
    createNotification(
      ride.driver_id,
      'sos',
      'Passenger SOS alert',
      `${user.full_name} triggered SOS on your active ride.`,
      '/driver/active-ride'
    );
  }
  serverEmit({ broadcast: true }, 'sos:triggered', incident);
  return incident;
}

/** GET /api/sos/mine */
export function mySosIncidents(ctx: Ctx) {
  const auth = requireAuth(ctx);
  return db().sos_incidents.filter((s) => s.user_id === auth.sub);
}

/* --------------------------- trip share -------------------------- */

/** POST /api/rides/:id/share */
export function createTripShare(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const ride = db().rides.find((r) => r.id === ctx.params.id);
  if (!ride) throw new ApiError(404, 'Ride not found.');
  const booking =
  db().bookings.find(
    (b) => b.ride_id === ride.id && b.passenger_id === auth.sub
  ) ?? null;
  if (ride.driver_id !== auth.sub && !booking)
  throw new ApiError(403, 'Only people on this ride can share it.');
  const share: TripShare = {
    id: uid('ts'),
    token: uid('trip').replace('trip_', 'trip-'),
    ride_id: ride.id,
    booking_id: booking?.id ?? null,
    created_by: auth.sub,
    created_at: nowIso()
  };
  db().trip_shares.push(share);
  persist();
  return share;
}

/** GET /api/trip-shares/:token — public, read-only */
export function getTripShare(ctx: Ctx) {
  const share = db().trip_shares.find((s) => s.token === ctx.params.token);
  if (!share) throw new ApiError(404, 'This trip link is no longer valid.');
  const ride = db().rides.find((r) => r.id === share.ride_id)!;
  const full = hydrate(ride);
  return {
    share,
    ride: {
      id: full.id,
      source: full.source,
      destination: full.destination,
      source_coords: full.source_coords,
      dest_coords: full.dest_coords,
      route: full.route,
      departure_date: full.departure_date,
      departure_time: full.departure_time,
      status: full.status,
      stage: full.stage,
      driver_location: full.driver_location,
      location_updated_at: full.location_updated_at,
      driver: {
        full_name: full.driver.full_name,
        avatar_url: full.driver.avatar_url,
        verified: full.driver.verified,
        rating: full.driver.rating
      },
      vehicle: full.vehicle ?
      {
        make: full.vehicle.make,
        model: full.vehicle.model,
        number: full.vehicle.number,
        color: full.vehicle.color
      } :
      null
    }
  };
}

/* ------------------------- reported issues ----------------------- */

/** POST /api/issues */
export function reportIssue(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const { category, description, ride_id = null } = ctx.body ?? {};
  validate([
  [!!category, 'Choose a category.'],
  [!!description && description.length >= 10, 'Describe the issue in a little more detail.']]
  );
  const issue: ReportedIssue = {
    id: uid('iss'),
    user_id: auth.sub,
    ride_id,
    category,
    description,
    status: 'open',
    created_at: nowIso()
  };
  db().reported_issues.unshift(issue);
  persist();
  return issue;
}