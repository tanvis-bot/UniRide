import type { User } from '../../types';
import { db, nowIso, persist, uid } from '../db';
import { ApiError, requireAuth, validate, type Ctx } from '../middleware/auth';
import { comparePassword, hashPassword, signToken } from '../security';
import { isDriverApproved, isStudentApproved, toPublicUser } from '../services/users';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9 ()-]{8,18}$/;

function session(user: User) {
  return {
    token: signToken({ sub: user.id, role: user.role, email: user.email }),
    user: toPublicUser(user),
    verification: {
      student: db().student_verifications.find((v) => v.user_id === user.id)?.status ?? 'not_submitted',
      driver: db().driver_verifications.find((v) => v.user_id === user.id)?.status ?? 'not_submitted'
    }
  };
}

/** POST /api/auth/register */
export function register(ctx: Ctx) {
  const { full_name, email, phone, password, confirm_password, role } = ctx.body ?? {};
  validate([
  [!!full_name && full_name.trim().length >= 3, 'Enter your full name.'],
  [EMAIL_RE.test(email ?? ''), 'Enter a valid email address.'],
  [PHONE_RE.test(phone ?? ''), 'Enter a valid phone number.'],
  [(password ?? '').length >= 8, 'Password must be at least 8 characters.'],
  [password === confirm_password, 'Passwords do not match.'],
  [role === 'passenger' || role === 'driver', 'Choose passenger or driver.']]
  );
  if (db().users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
  throw new ApiError(409, 'An account with this email already exists.');

  const user: User = {
    id: uid('u'),
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    password_hash: hashPassword(password),
    role,
    status: 'active',
    avatar_url: '',
    rating: 0,
    total_trips: 0,
    created_at: nowIso(),
    updated_at: nowIso()
  };
  db().users.push(user);
  if (role === 'driver') {
    db().driver_verifications.push({
      id: uid('dv'),
      user_id: user.id,
      licence_number: '',
      licence_doc: '',
      gov_id_type: '',
      gov_id_doc: '',
      status: 'not_submitted',
      remarks: null,
      submitted_at: null,
      reviewed_at: null
    });
  }
  persist();
  return session(user);
}

/** POST /api/auth/login */
export function login(ctx: Ctx) {
  const { email, password } = ctx.body ?? {};
  validate([
  [EMAIL_RE.test(email ?? ''), 'Enter a valid email address.'],
  [!!password, 'Enter your password.']]
  );
  const user = db().users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
  if (!user || !comparePassword(password, user.password_hash))
  throw new ApiError(401, 'Incorrect email or password.');
  if (user.status === 'suspended')
  throw new ApiError(403, 'This account is suspended. Contact support@uniride.app.');
  if (user.status === 'deactivated')
  throw new ApiError(403, 'This account has been deactivated.');
  return session(user);
}

/** GET /api/auth/me — validates the bearer token on every app load. */
export function me(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const user = db().users.find((u) => u.id === auth.sub)!;
  return {
    user: toPublicUser(user),
    verification: {
      student: db().student_verifications.find((v) => v.user_id === user.id)?.status ?? 'not_submitted',
      driver: db().driver_verifications.find((v) => v.user_id === user.id)?.status ?? 'not_submitted'
    },
    studentApproved: isStudentApproved(user.id),
    driverApproved: isDriverApproved(user.id)
  };
}

/** POST /api/auth/forgot-password */
export function forgotPassword(ctx: Ctx) {
  const { email } = ctx.body ?? {};
  validate([[EMAIL_RE.test(email ?? ''), 'Enter a valid email address.']]);
  const exists = db().users.some(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
  // Never disclose whether the address exists.
  return {
    message: 'If an account exists for that email, a reset link is on its way.',
    resetToken: exists ? signToken({ sub: email, role: 'passenger', email }, 900) : null
  };
}

/** POST /api/auth/reset-password */
export function resetPassword(ctx: Ctx) {
  const { email, password, confirm_password } = ctx.body ?? {};
  validate([
  [EMAIL_RE.test(email ?? ''), 'Enter a valid email address.'],
  [(password ?? '').length >= 8, 'Password must be at least 8 characters.'],
  [password === confirm_password, 'Passwords do not match.']]
  );
  const user = db().users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
  if (!user) throw new ApiError(404, 'No account found for that email.');
  user.password_hash = hashPassword(password);
  user.updated_at = nowIso();
  persist();
  return { message: 'Password updated. You can sign in now.' };
}

/** PATCH /api/users/me */
export function updateProfile(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const user = db().users.find((u) => u.id === auth.sub)!;
  const { full_name, phone, avatar_url } = ctx.body ?? {};
  validate([
  [!full_name || full_name.trim().length >= 3, 'Enter your full name.'],
  [!phone || PHONE_RE.test(phone), 'Enter a valid phone number.']]
  );
  if (full_name) user.full_name = full_name.trim();
  if (phone) user.phone = phone.trim();
  if (avatar_url !== undefined) user.avatar_url = avatar_url;
  user.updated_at = nowIso();
  persist();
  return toPublicUser(user);
}

/** POST /api/users/me/password */
export function changePassword(ctx: Ctx) {
  const auth = requireAuth(ctx);
  const user = db().users.find((u) => u.id === auth.sub)!;
  const { current_password, password, confirm_password } = ctx.body ?? {};
  if (!comparePassword(current_password ?? '', user.password_hash))
  throw new ApiError(422, 'Current password is incorrect.');
  validate([
  [(password ?? '').length >= 8, 'Password must be at least 8 characters.'],
  [password === confirm_password, 'Passwords do not match.']]
  );
  user.password_hash = hashPassword(password);
  user.updated_at = nowIso();
  persist();
  return { message: 'Password changed.' };
}