import type { Ride } from '../../types';
import { coordsFor } from '../../data/places';
import { buildRoute } from '../../utils/geo';
import { db, nowIso, persist, uid } from '../db';
import {
  ApiError,
  requireAuth,
  requireRole,
  validate,
  type Ctx } from
'../middleware/auth';
import { calculateFare } from '../services/fare';
import { createNotification } from '../services/notifications';
import { driverProfile, isDriverApproved, isStudentApproved, toPublicUser } from '../services/users';
import { serverEmit } from '../socket';

export function hydrate(ride: Ride) {
  const vehicle = db().vehicles.find((v) => v.id === ride.vehicle_id) ?? null;
  const seatsTaken = db().
  bookings.filter((b) => b.ride_id === ride.id && b.status === 'confirmed').
  reduce((sum, b) => sum + b.seats, 0);
  return {
    ...ride,
    driver: driverProfile(ride.driver_id),
    vehicle,
    confirmed_passengers: seatsTaken,
    per_seat_fare: Math.round(ride.total_cost / Math.max(1, seatsTaken + 1)),
    route: buildRoute(ride.source_coords, ride.dest_coords).coordinates
  };
}

export type HydratedRide = ReturnType<typeof hydrate>;

function findRideOrFail(id: string): Ride {
  const ride = db().rides.find((r) => r.id === id);
  if (!ride) throw new ApiError(404, 'This ride no longer exists.');
  return ride;
}

/** GET /api/rides — public search */
export function searchRides(ctx: Ctx) {
  const {
    source,
    destination,
    date,
    seats = 1,
    maxFare,
    verifiedOnly,
    timeBand,
    sort = 'departure'
  } = ctx.query;
  let results = db().rides.filter(
    (r) => r.status === 'scheduled' && r.available_seats > 0
  );
  if (source)
  results = results.filter((r) =>
  r.source.toLowerCase().includes(String(source).toLowerCase())
  );
  if (destination)
  results = results.filter((r) =>
  r.destination.toLowerCase().includes(String(destination).toLowerCase())
  );
  if (date) results = results.filter((r) => r.departure_date === date);
  if (seats) results = results.filter((r) => r.available_seats >= Number(seats));
  if (verifiedOnly) results = results.filter((r) => isDriverApproved(r.driver_id));
  if (timeBand && timeBand !== 'any') {
    results = results.filter((r) => {
      const hour = Number(r.departure_time.slice(0, 2));
      if (timeBand === 'morning') return hour < 12;
      if (timeBand === 'afternoon') return hour >= 12 && hour < 17;
      return hour >= 17;
    });
  }
  let hydrated = results.map(hydrate);
  if (maxFare)
  hydrated = hydrated.filter((r) => r.per_seat_fare <= Number(maxFare));
  hydrated.sort((a, b) => {
    if (sort === 'fare') return a.per_seat_fare - b.per_seat_fare;
    if (sort === 'seats') return b.available_seats - a.available_seats;
    return `${a.departure_date}${a.departure_time}`.localeCompare(
      `${b.departure_date}${b.departure_time}`
    );
  });
  return hydrated;
}

/** GET /api/rides/:id */
export function getRide(ctx: Ctx) {
  const ride = findRideOrFail(ctx.params.id);
  return hydrate(ride);
}

/** GET /api/rides/:id/fare-quote */
export function fareQuote(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const ride = findRideOrFail(ctx.params.id);
  return calculateFare(ride, db().bookings, {
    seats: Number(ctx.query.seats ?? 1),
    studentApproved: isStudentApproved(auth.sub),
    discountPct: db().settings.student_discount_pct
  });
}

/** GET /api/rides/mine — driver's own rides */
export function myRides(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  return db().
  rides.filter((r) => r.driver_id === auth.sub).
  map(hydrate).
  sort((a, b) =>
  `${b.departure_date}${b.departure_time}`.localeCompare(
    `${a.departure_date}${a.departure_time}`
  )
  );
}

/** POST /api/rides */
export function createRide(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const {
    source,
    destination,
    departure_date,
    departure_time,
    total_seats,
    total_cost,
    vehicle_id,
    notes = '',
    publish = true
  } = ctx.body ?? {};
  validate([
  [!!source, 'Choose a pickup point.'],
  [!!destination, 'Choose a destination.'],
  [source !== destination, 'Pickup and destination must be different.'],
  [!!departure_date, 'Choose a departure date.'],
  [!!departure_time, 'Choose a departure time.'],
  [Number(total_seats) >= 1 && Number(total_seats) <= 6, 'Seats must be between 1 and 6.'],
  [Number(total_cost) > 0, 'Enter the estimated total ride cost.'],
  [!!vehicle_id, 'Select a vehicle.']]
  );
  if (publish && !isDriverApproved(auth.sub))
  throw new ApiError(
    403,
    'Your driver verification is pending. You can offer rides after your documents are approved.'
  );
  const source_coords = coordsFor(source);
  const dest_coords = coordsFor(destination);
  const route = buildRoute(source_coords, dest_coords);
  const ride: Ride = {
    id: uid('r'),
    driver_id: auth.sub,
    vehicle_id,
    source,
    destination,
    source_coords,
    dest_coords,
    departure_date,
    departure_time,
    total_seats: Number(total_seats),
    available_seats: Number(total_seats),
    total_cost: Number(total_cost),
    distance_km: route.distanceKm,
    duration_min: route.durationMin,
    status: publish ? 'scheduled' : 'draft',
    stage: 'starting_soon',
    driver_location: null,
    location_updated_at: null,
    notes,
    created_at: nowIso(),
    updated_at: nowIso()
  };
  db().rides.push(ride);
  persist();
  return hydrate(ride);
}

/** PATCH /api/rides/:id */
export function updateRide(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const ride = findRideOrFail(ctx.params.id);
  if (ride.driver_id !== auth.sub)
  throw new ApiError(403, 'You can only edit your own rides.');
  if (ride.status === 'completed' || ride.status === 'cancelled')
  throw new ApiError(409, 'This ride can no longer be edited.');
  const patch = ctx.body ?? {};
  const seatsTaken = ride.total_seats - ride.available_seats;
  if (patch.total_seats && Number(patch.total_seats) < seatsTaken)
  throw new ApiError(409, `${seatsTaken} seats are already booked.`);
  Object.assign(ride, {
    source: patch.source ?? ride.source,
    destination: patch.destination ?? ride.destination,
    departure_date: patch.departure_date ?? ride.departure_date,
    departure_time: patch.departure_time ?? ride.departure_time,
    total_cost: patch.total_cost ? Number(patch.total_cost) : ride.total_cost,
    notes: patch.notes ?? ride.notes,
    updated_at: nowIso()
  });
  if (patch.total_seats) {
    ride.total_seats = Number(patch.total_seats);
    ride.available_seats = ride.total_seats - seatsTaken;
  }
  if (patch.source || patch.destination) {
    ride.source_coords = coordsFor(ride.source);
    ride.dest_coords = coordsFor(ride.destination);
    const route = buildRoute(ride.source_coords, ride.dest_coords);
    ride.distance_km = route.distanceKm;
    ride.duration_min = route.durationMin;
  }
  if (patch.status === 'scheduled' && ride.status === 'draft') {
    if (!isDriverApproved(auth.sub))
    throw new ApiError(403, 'Driver verification must be approved before publishing.');
    ride.status = 'scheduled';
  }
  persist();
  return hydrate(ride);
}

/** POST /api/rides/:id/cancel */
export function cancelRide(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const ride = findRideOrFail(ctx.params.id);
  if (ride.driver_id !== auth.sub && auth.role !== 'admin')
  throw new ApiError(403, 'You can only cancel your own rides.');
  ride.status = 'cancelled';
  ride.updated_at = nowIso();
  db().
  bookings.filter((b) => b.ride_id === ride.id && ['pending', 'confirmed'].includes(b.status)).
  forEach((b) => {
    b.status = 'cancelled';
    b.updated_at = nowIso();
    createNotification(
      b.passenger_id,
      'ride_cancelled',
      'Ride cancelled',
      `${ride.source} → ${ride.destination} on ${ride.departure_date} was cancelled.`,
      '/passenger/bookings'
    );
  });
  persist();
  serverEmit({ ride: ride.id, broadcast: true }, 'ride:status', hydrate(ride));
  return hydrate(ride);
}

/** POST /api/rides/:id/status */
export function updateRideStatus(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const ride = findRideOrFail(ctx.params.id);
  if (ride.driver_id !== auth.sub)
  throw new ApiError(403, 'You can only manage your own rides.');
  const { stage } = ctx.body ?? {};
  const flow: Ride['stage'][] = [
  'starting_soon',
  'driver_on_the_way',
  'ride_started',
  'in_progress',
  'arriving',
  'completed'];

  if (!flow.includes(stage)) throw new ApiError(422, 'Unknown ride stage.');
  ride.stage = stage;
  ride.status = stage === 'completed' ? 'completed' : 'active';
  ride.updated_at = nowIso();

  const passengers = db().bookings.filter(
    (b) => b.ride_id === ride.id && b.status === 'confirmed'
  );
  if (stage === 'completed') {
    passengers.forEach((b) => {
      b.status = 'completed';
      b.updated_at = nowIso();
      createNotification(
        b.passenger_id,
        'ride_completed',
        'Trip completed',
        `Your trip to ${ride.destination} is complete. Rate your driver.`,
        '/passenger/bookings'
      );
    });
  } else if (stage === 'ride_started') {
    passengers.forEach((b) =>
    createNotification(
      b.passenger_id,
      'ride_starting',
      'Your ride has started',
      `${ride.source} → ${ride.destination} is now in progress.`,
      '/passenger/active-ride'
    )
    );
  }
  persist();
  serverEmit({ ride: ride.id, broadcast: true }, 'ride:status', hydrate(ride));
  return hydrate(ride);
}

/** POST /api/rides/:id/location — driver GPS ping */
export function updateRideLocation(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const ride = findRideOrFail(ctx.params.id);
  if (ride.driver_id !== auth.sub)
  throw new ApiError(403, 'You can only broadcast your own location.');
  const { lat, lng } = ctx.body ?? {};
  ride.driver_location = { lat: Number(lat), lng: Number(lng) };
  ride.location_updated_at = nowIso();
  persist();
  serverEmit({ ride: ride.id, broadcast: true }, 'ride:location', {
    rideId: ride.id,
    location: ride.driver_location,
    updatedAt: ride.location_updated_at
  });
  return { ok: true, updatedAt: ride.location_updated_at };
}

/** GET /api/rides/:id/passengers */
export function ridePassengers(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const ride = findRideOrFail(ctx.params.id);
  if (ride.driver_id !== auth.sub && auth.role !== 'admin')
  throw new ApiError(403, 'You are not allowed to access this resource.');
  return db().
  bookings.filter((b) => b.ride_id === ride.id).
  map((b) => {
    const passenger = db().users.find((u) => u.id === b.passenger_id)!;
    return {
      booking: b,
      passenger: toPublicUser(passenger),
      student_verified: isStudentApproved(passenger.id)
    };
  });
}

/** GET /api/rides/active — the current active ride for the signed-in user */
export function activeRide(ctx: Ctx) {
  const auth = requireAuth(ctx);
  if (auth.role === 'driver') {
    const ride = db().rides.find(
      (r) => r.driver_id === auth.sub && r.status === 'active'
    );
    return ride ? hydrate(ride) : null;
  }
  const booking = db().bookings.find(
    (b) =>
    b.passenger_id === auth.sub &&
    b.status === 'confirmed' &&
    db().rides.find((r) => r.id === b.ride_id)?.status === 'active'
  );
  if (!booking) return null;
  const ride = db().rides.find((r) => r.id === booking.ride_id)!;
  return { ...hydrate(ride), booking };
}