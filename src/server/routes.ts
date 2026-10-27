import * as auth from './controllers/authController';
import * as rides from './controllers/rideController';
import * as bookings from './controllers/bookingController';
import * as verification from './controllers/verificationController';
import * as misc from './controllers/miscController';
import * as admin from './controllers/adminController';
import type { Ctx } from './middleware/auth';

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface Route {
  method: Method;
  path: string;
  handler: (ctx: Ctx) => unknown;
}

/** Express router table — mirrors server/routes/*.js on the Node side. */
export const routes: Route[] = [
// /api/auth
{ method: 'POST', path: '/api/auth/register', handler: auth.register },
{ method: 'POST', path: '/api/auth/login', handler: auth.login },
{ method: 'GET', path: '/api/auth/me', handler: auth.me },
{ method: 'POST', path: '/api/auth/forgot-password', handler: auth.forgotPassword },
{ method: 'POST', path: '/api/auth/reset-password', handler: auth.resetPassword },

// /api/users
{ method: 'PATCH', path: '/api/users/me', handler: auth.updateProfile },
{ method: 'POST', path: '/api/users/me/password', handler: auth.changePassword },

// /api/rides
{ method: 'GET', path: '/api/rides', handler: rides.searchRides },
{ method: 'POST', path: '/api/rides', handler: rides.createRide },
{ method: 'GET', path: '/api/rides/mine', handler: rides.myRides },
{ method: 'GET', path: '/api/rides/active', handler: rides.activeRide },
{ method: 'GET', path: '/api/rides/:id', handler: rides.getRide },
{ method: 'PATCH', path: '/api/rides/:id', handler: rides.updateRide },
{ method: 'GET', path: '/api/rides/:id/fare-quote', handler: rides.fareQuote },
{ method: 'GET', path: '/api/rides/:id/passengers', handler: rides.ridePassengers },
{ method: 'POST', path: '/api/rides/:id/cancel', handler: rides.cancelRide },
{ method: 'POST', path: '/api/rides/:id/status', handler: rides.updateRideStatus },
{ method: 'POST', path: '/api/rides/:id/location', handler: rides.updateRideLocation },
{ method: 'POST', path: '/api/rides/:id/share', handler: misc.createTripShare },

// /api/bookings
{ method: 'POST', path: '/api/bookings', handler: bookings.createBooking },
{ method: 'GET', path: '/api/bookings/mine', handler: bookings.myBookings },
{ method: 'GET', path: '/api/bookings/requests', handler: bookings.bookingRequests },
{ method: 'GET', path: '/api/bookings/:id', handler: bookings.getBooking },
{ method: 'POST', path: '/api/bookings/:id/cancel', handler: bookings.cancelBooking },
{ method: 'POST', path: '/api/bookings/:id/decision', handler: bookings.decideBooking },

// /api/students & /api/drivers
{ method: 'GET', path: '/api/students/me', handler: verification.getStudentVerification },
{ method: 'POST', path: '/api/students/verify', handler: verification.submitStudentVerification },
{ method: 'GET', path: '/api/drivers/me/verification', handler: verification.getDriverVerification },
{ method: 'POST', path: '/api/drivers/verify', handler: verification.submitDriverVerification },

// /api/vehicles
{ method: 'GET', path: '/api/vehicles', handler: verification.listVehicles },
{ method: 'POST', path: '/api/vehicles', handler: verification.createVehicle },
{ method: 'PATCH', path: '/api/vehicles/:id', handler: verification.updateVehicle },
{ method: 'DELETE', path: '/api/vehicles/:id', handler: verification.deleteVehicle },

// /api/notifications
{ method: 'GET', path: '/api/notifications', handler: misc.listNotifications },
{ method: 'POST', path: '/api/notifications/read-all', handler: misc.readAllNotifications },
{ method: 'POST', path: '/api/notifications/:id/read', handler: misc.readNotification },

// /api/chat
{ method: 'GET', path: '/api/chat/threads', handler: misc.chatThreads },
{ method: 'GET', path: '/api/chat/:rideId/:userId', handler: misc.chatMessages },
{ method: 'POST', path: '/api/chat/:rideId', handler: misc.sendChatMessage },

// /api/emergency & /api/sos
{ method: 'GET', path: '/api/emergency', handler: misc.listEmergencyContacts },
{ method: 'POST', path: '/api/emergency', handler: misc.addEmergencyContact },
{ method: 'DELETE', path: '/api/emergency/:id', handler: misc.deleteEmergencyContact },
{ method: 'POST', path: '/api/sos', handler: misc.triggerSos },
{ method: 'GET', path: '/api/sos/mine', handler: misc.mySosIncidents },

// public trip share + issues
{ method: 'GET', path: '/api/trip-shares/:token', handler: misc.getTripShare },
{ method: 'POST', path: '/api/issues', handler: misc.reportIssue },

// /api/admin
{ method: 'GET', path: '/api/admin/stats', handler: admin.stats },
{ method: 'GET', path: '/api/admin/users', handler: admin.listUsers },
{ method: 'PATCH', path: '/api/admin/users/:id/status', handler: admin.setUserStatus },
{ method: 'GET', path: '/api/admin/verifications', handler: admin.listVerifications },
{ method: 'POST', path: '/api/admin/verifications/:id/review', handler: admin.reviewVerification },
{ method: 'GET', path: '/api/admin/rides', handler: admin.listRides },
{ method: 'GET', path: '/api/admin/bookings', handler: admin.listBookings },
{ method: 'GET', path: '/api/admin/issues', handler: admin.listIssues },
{ method: 'PATCH', path: '/api/admin/issues/:id', handler: admin.updateIssue }];


export function matchRoute(
method: Method,
path: string)
: {route: Route;params: Record<string, string>;} | null {
  const segments = path.split('/').filter(Boolean);
  for (const route of routes) {
    if (route.method !== method) continue;
    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== segments.length) continue;
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < routeSegments.length; i++) {
      const rs = routeSegments[i];
      if (rs.startsWith(':')) params[rs.slice(1)] = decodeURIComponent(segments[i]);else
      if (rs !== segments[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params };
  }
  return null;
}