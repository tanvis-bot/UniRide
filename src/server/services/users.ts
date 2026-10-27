import type { PublicUser, User } from '../../types';
import { db } from '../db';
import { ApiError } from '../middleware/auth';

/** Passwords are never serialised out of the API layer. */
export function toPublicUser(user: User): PublicUser {
  const { password_hash: _omit, ...safe } = user;
  return safe;
}

export function findUserOrFail(id: string): User {
  const user = db().users.find((u) => u.id === id);
  if (!user) throw new ApiError(404, 'User not found.');
  return user;
}

export function isStudentApproved(userId: string): boolean {
  return db().student_verifications.some(
    (v) => v.user_id === userId && v.status === 'approved'
  );
}

export function isDriverApproved(userId: string): boolean {
  return db().driver_verifications.some(
    (v) => v.user_id === userId && v.status === 'approved'
  );
}

export function driverProfile(driverId: string) {
  const user = findUserOrFail(driverId);
  return {
    ...toPublicUser(user),
    verified: isDriverApproved(driverId)
  };
}