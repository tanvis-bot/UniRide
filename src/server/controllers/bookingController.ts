import type { Booking } from '../../types';
import { db, nowIso, persist } from '../db';
import {
  ApiError,
  requireAuth,
  requireRole,
  validate,
  type Ctx } from
'../middleware/auth';
import { calculateFare } from '../services/fare';
import { createNotification } from '../services/notifications';
import { isStudentApproved, toPublicUser } from '../services/users';
import { hydrate } from './rideController';
import { serverEmit } from '../socket';

let counter = 24900;

function nextBookingId(): string {
  counter += 1;
  return `BK-${counter}`;
}

function hydrateBooking(booking: Booking) {
  const ride = db().rides.find((r) => r.id === booking.ride_id)!;
  return { ...booking, ride: hydrate(ride) };
}

/** POST /api/bookings */
export function createBooking(ctx: Ctx) {
  const auth = requireRole(ctx, 'passenger');
  const { ride_id, seats = 1 } = ctx.body ?? {};
  validate([[Number(seats) >= 1, 'Select at least one seat.']]);

  const ride = db().rides.find((r) => r.id === ride_id);
  if (!ride) throw new ApiError(404, 'This ride no longer exists.');
  if (ride.status !== 'scheduled')
  throw new ApiError(409, 'This ride is not accepting bookings any more.');
  if (ride.available_seats < Number(seats))
  throw new ApiError(409, `Only ${ride.available_seats} seat(s) left on this ride.`);
  if (
  db().bookings.some(
    (b) =>
    b.ride_id === ride.id &&
    b.passenger_id === auth.sub &&
    ['pending', 'confirmed'].includes(b.status)
  ))

  throw new ApiError(409, 'You already have a booking on this ride.');

  const fare = calculateFare(ride, db().bookings, {
    seats: Number(seats),
    studentApproved: isStudentApproved(auth.sub),
    discountPct: db().settings.student_discount_pct
  });

  const booking: Booking = {
    id: nextBookingId(),
    ride_id: ride.id,
    passenger_id: auth.sub,
    seats: Number(seats),
    base_fare: fare.baseFare,
    discount: fare.discount,
    final_fare: fare.finalFare,
    status: 'pending',
    created_at: nowIso(),
    updated_at: nowIso()
  };
  db().bookings.push(booking);
  ride.available_seats -= Number(seats);
  ride.updated_at = nowIso();
  persist();

  const passenger = db().users.find((u) => u.id === auth.sub)!;
  createNotification(
    ride.driver_id,
    'booking_request',
    'New booking request',
    `${passenger.full_name} requested ${seats} seat(s) on ${ride.source} → ${ride.destination}.`,
    '/driver/requests'
  );
  serverEmit({ broadcast: true }, 'booking:update', booking);
  return hydrateBooking(booking);
}

/** GET /api/bookings/mine */
export function myBookings(ctx: Ctx) {
  const auth = requireAuth(ctx);
  return db().
  bookings.filter((b) => b.passenger_id === auth.sub).
  map(hydrateBooking).
  sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** GET /api/bookings/:id */
export function getBooking(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const booking = db().bookings.find((b) => b.id === ctx.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found.');
  const ride = db().rides.find((r) => r.id === booking.ride_id)!;
  if (
  booking.passenger_id !== auth.sub &&
  ride.driver_id !== auth.sub &&
  auth.role !== 'admin')

  throw new ApiError(403, 'You are not allowed to access this booking.');
  return hydrateBooking(booking);
}

/** POST /api/bookings/:id/cancel */
export function cancelBooking(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const booking = db().bookings.find((b) => b.id === ctx.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (booking.passenger_id !== auth.sub && auth.role !== 'admin')
  throw new ApiError(403, 'You can only cancel your own bookings.');
  if (!['pending', 'confirmed'].includes(booking.status))
  throw new ApiError(409, 'This booking can no longer be cancelled.');
  booking.status = 'cancelled';
  booking.updated_at = nowIso();
  const ride = db().rides.find((r) => r.id === booking.ride_id)!;
  ride.available_seats = Math.min(ride.total_seats, ride.available_seats + booking.seats);
  persist();
  createNotification(
    ride.driver_id,
    'ride_cancelled',
    'Booking cancelled',
    `A passenger cancelled their seat on ${ride.source} → ${ride.destination}.`,
    '/driver/rides'
  );
  return hydrateBooking(booking);
}

/** GET /api/bookings/requests — driver inbox */
export function bookingRequests(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const rideIds = db().
  rides.filter((r) => r.driver_id === auth.sub).
  map((r) => r.id);
  return db().
  bookings.filter((b) => rideIds.includes(b.ride_id)).
  map((b) => ({
    ...hydrateBooking(b),
    passenger: toPublicUser(db().users.find((u) => u.id === b.passenger_id)!),
    student_verified: isStudentApproved(b.passenger_id)
  })).
  sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** POST /api/bookings/:id/decision */
export function decideBooking(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const booking = db().bookings.find((b) => b.id === ctx.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found.');
  const ride = db().rides.find((r) => r.id === booking.ride_id)!;
  if (ride.driver_id !== auth.sub)
  throw new ApiError(403, 'You can only manage requests on your own rides.');
  if (booking.status !== 'pending')
  throw new ApiError(409, 'This request has already been handled.');

  const decision = ctx.body?.decision;
  if (decision === 'accept') {
    booking.status = 'confirmed';
    // recompute fares for everyone now that the split changed
    const confirmed = db().bookings.filter(
      (b) => b.ride_id === ride.id && b.status === 'confirmed'
    );
    confirmed.forEach((b) => {
      const perSeat = Math.round(ride.total_cost / confirmed.length);
      const base = perSeat * b.seats;
      const discount = isStudentApproved(b.passenger_id) ?
      Math.round(base * db().settings.student_discount_pct / 100) :
      0;
      b.base_fare = base;
      b.discount = discount;
      b.final_fare = base - discount;
      b.updated_at = nowIso();
    });
    createNotification(
      booking.passenger_id,
      'booking_confirmed',
      'Booking confirmed',
      `${booking.id} · ${ride.source} → ${ride.destination} is confirmed.`,
      '/passenger/bookings'
    );
  } else if (decision === 'reject') {
    booking.status = 'rejected';
    ride.available_seats = Math.min(ride.total_seats, ride.available_seats + booking.seats);
    createNotification(
      booking.passenger_id,
      'booking_rejected',
      'Booking rejected',
      `${booking.id} · ${ride.source} → ${ride.destination} was declined by the driver.`,
      '/passenger/bookings'
    );
  } else {
    throw new ApiError(422, 'Unknown decision.');
  }
  booking.updated_at = nowIso();
  persist();
  serverEmit({ broadcast: true }, 'booking:update', booking);
  return hydrateBooking(booking);
}