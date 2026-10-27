import type { Role } from '../../types';
import { db } from '../db';
import type { JwtPayload } from '../security';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export interface Ctx {
  auth: JwtPayload | null;
  body: any;
  query: Record<string, any>;
  params: Record<string, string>;
}

/** Equivalent of the Express `protect` middleware. */
export function requireAuth(ctx: Ctx): JwtPayload {
  if (!ctx.auth) throw new ApiError(401, 'Session expired. Please sign in again.');
  const user = db().users.find((u) => u.id === ctx.auth!.sub);
  if (!user) throw new ApiError(401, 'Account no longer exists.');
  if (user.status !== 'active')
  throw new ApiError(403, 'This account has been suspended. Contact support.');
  return ctx.auth;
}

/** Equivalent of the Express `authorize(...roles)` middleware. */
export function requireRole(ctx: Ctx, ...roles: Role[]): JwtPayload {
  const auth = requireAuth(ctx);
  if (!roles.includes(auth.role))
  throw new ApiError(403, 'You are not allowed to access this resource.');
  return auth;
}

export function assertOwnership(auth: JwtPayload, ownerId: string): void {
  if (auth.sub !== ownerId && auth.role !== 'admin')
  throw new ApiError(403, 'You are not allowed to access this resource.');
}

export function validate(
rules: Array<[boolean, string]>)
: void {
  const failed = rules.find(([ok]) => !ok);
  if (failed) throw new ApiError(422, failed[1]);
}