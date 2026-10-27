import { db, nowIso, persist } from '../db';
import { ApiError, requireRole, validate, type Ctx } from '../middleware/auth';
import { createNotification } from '../services/notifications';
import { isDriverApproved, isStudentApproved, toPublicUser } from '../services/users';
import { hydrate } from './rideController';

/** GET /api/admin/stats */
export function stats(ctx: Ctx) {
  requireRole(ctx, 'admin');
  const d = db();
  const drivers = d.users.filter((u) => u.role === 'driver');
  const passengers = d.users.filter((u) => u.role === 'passenger');
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = date.toISOString().slice(0, 10);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      rides: d.rides.filter((r) => r.departure_date === key).length,
      bookings: d.bookings.filter((b) => b.created_at.slice(0, 10) === key).length
    };
  });
  return {
    totals: {
      users: d.users.length,
      passengers: passengers.length,
      drivers: drivers.length,
      verifiedDrivers: drivers.filter((u) => isDriverApproved(u.id)).length,
      verifiedStudents: passengers.filter((u) => isStudentApproved(u.id)).length,
      rides: d.rides.length,
      activeRides: d.rides.filter((r) => r.status === 'active').length,
      completedRides: d.rides.filter((r) => r.status === 'completed').length,
      cancelledRides: d.rides.filter((r) => r.status === 'cancelled').length,
      bookings: d.bookings.length,
      pendingVerifications:
      d.driver_verifications.filter((v) => v.status === 'pending').length +
      d.student_verifications.filter((v) => v.status === 'pending').length,
      openIssues: d.reported_issues.filter((i) => i.status !== 'resolved').length,
      sosIncidents: d.sos_incidents.length
    },
    activity: last7,
    rideMix: [
    { name: 'Scheduled', value: d.rides.filter((r) => r.status === 'scheduled').length },
    { name: 'Active', value: d.rides.filter((r) => r.status === 'active').length },
    { name: 'Completed', value: d.rides.filter((r) => r.status === 'completed').length },
    { name: 'Cancelled', value: d.rides.filter((r) => r.status === 'cancelled').length }]

  };
}

/** GET /api/admin/users */
export function listUsers(ctx: Ctx) {
  requireRole(ctx, 'admin');
  const { q = '', role = 'all', status = 'all' } = ctx.query;
  return db().
  users.filter((u) => {
    const matchesQuery =
    !q ||
    u.full_name.toLowerCase().includes(String(q).toLowerCase()) ||
    u.email.toLowerCase().includes(String(q).toLowerCase());
    const matchesRole = role === 'all' || u.role === role;
    const matchesStatus = status === 'all' || u.status === status;
    return matchesQuery && matchesRole && matchesStatus;
  }).
  map((u) => ({
    ...toPublicUser(u),
    student_verified: isStudentApproved(u.id),
    driver_verified: isDriverApproved(u.id),
    vehicles: db().vehicles.filter((v) => v.driver_id === u.id).length
  })).
  sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** PATCH /api/admin/users/:id/status */
export function setUserStatus(ctx: Ctx) {
  requireRole(ctx, 'admin');
  const user = db().users.find((u) => u.id === ctx.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.role === 'admin') throw new ApiError(403, 'Admin accounts cannot be modified here.');
  const { status } = ctx.body ?? {};
  validate([
  [
  ['active', 'suspended', 'deactivated'].includes(status),
  'Unknown account status.']]

  );
  user.status = status;
  user.updated_at = nowIso();
  persist();
  return toPublicUser(user);
}

/** GET /api/admin/verifications?type=driver|student */
export function listVerifications(ctx: Ctx) {
  requireRole(ctx, 'admin');
  const type = ctx.query.type === 'student' ? 'student' : 'driver';
  const statusFilter = ctx.query.status ?? 'all';
  const rows =
  type === 'student' ?
  db().student_verifications.map((v) => ({
    type: 'student' as const,
    record: v,
    user: toPublicUser(db().users.find((u) => u.id === v.user_id)!),
    vehicles: []
  })) :
  db().driver_verifications.map((v) => ({
    type: 'driver' as const,
    record: v,
    user: toPublicUser(db().users.find((u) => u.id === v.user_id)!),
    vehicles: db().vehicles.filter((veh) => veh.driver_id === v.user_id)
  }));
  return rows.
  filter((r) => statusFilter === 'all' || r.record.status === statusFilter).
  sort((a, b) => (b.record.submitted_at ?? '').localeCompare(a.record.submitted_at ?? ''));
}

/** POST /api/admin/verifications/:id/review */
export function reviewVerification(ctx: Ctx) {
  requireRole(ctx, 'admin');
  const { type, decision, remarks = '' } = ctx.body ?? {};
  const table =
  type === 'student' ? db().student_verifications : db().driver_verifications;
  const record = table.find((v) => v.id === ctx.params.id);
  if (!record) throw new ApiError(404, 'Verification record not found.');
  validate([
  [decision === 'approve' || decision === 'reject', 'Unknown decision.'],
  [decision === 'approve' || remarks.trim().length >= 5, 'Give the user a reason for rejection.']]
  );
  record.status = decision === 'approve' ? 'approved' : 'rejected';
  record.remarks = decision === 'approve' ? remarks || 'Documents verified.' : remarks;
  record.reviewed_at = nowIso();
  persist();
  createNotification(
    record.user_id,
    decision === 'approve' ? 'verification_approved' : 'verification_rejected',
    decision === 'approve' ?
    `${type === 'student' ? 'Student' : 'Driver'} verification approved` :
    `${type === 'student' ? 'Student' : 'Driver'} verification rejected`,
    decision === 'approve' ?
    type === 'student' ?
    'You now receive the student discount on every booking.' :
    'You can now publish rides on UniRide.' :
    record.remarks ?? '',
    type === 'student' ? '/passenger/student-verification' : '/driver/verification'
  );
  return record;
}

/** GET /api/admin/rides */
export function listRides(ctx: Ctx) {
  requireRole(ctx, 'admin');
  const { status = 'all', q = '', date = '' } = ctx.query;
  return db().
  rides.filter((r) => {
    const matchesStatus = status === 'all' || r.status === status;
    const driver = db().users.find((u) => u.id === r.driver_id);
    const haystack = `${r.source} ${r.destination} ${driver?.full_name ?? ''}`.toLowerCase();
    const matchesQuery = !q || haystack.includes(String(q).toLowerCase());
    const matchesDate = !date || r.departure_date === date;
    return matchesStatus && matchesQuery && matchesDate;
  }).
  map(hydrate).
  sort((a, b) =>
  `${b.departure_date}${b.departure_time}`.localeCompare(
    `${a.departure_date}${a.departure_time}`
  )
  );
}

/** GET /api/admin/bookings */
export function listBookings(ctx: Ctx) {
  requireRole(ctx, 'admin');
  const { status = 'all' } = ctx.query;
  return db().
  bookings.filter((b) => status === 'all' || b.status === status).
  map((b) => {
    const ride = db().rides.find((r) => r.id === b.ride_id)!;
    return {
      ...b,
      route: `${ride.source} → ${ride.destination}`,
      departure: `${ride.departure_date} ${ride.departure_time}`,
      passenger: toPublicUser(db().users.find((u) => u.id === b.passenger_id)!),
      driver: toPublicUser(db().users.find((u) => u.id === ride.driver_id)!)
    };
  }).
  sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** GET /api/admin/issues */
export function listIssues(ctx: Ctx) {
  requireRole(ctx, 'admin');
  return {
    issues: db().reported_issues.map((i) => ({
      ...i,
      user: toPublicUser(db().users.find((u) => u.id === i.user_id)!)
    })),
    sos: db().sos_incidents.map((s) => ({
      ...s,
      user: toPublicUser(db().users.find((u) => u.id === s.user_id)!)
    }))
  };
}

/** PATCH /api/admin/issues/:id */
export function updateIssue(ctx: Ctx) {
  requireRole(ctx, 'admin');
  const issue = db().reported_issues.find((i) => i.id === ctx.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found.');
  issue.status = ctx.body?.status ?? issue.status;
  persist();
  return issue;
}