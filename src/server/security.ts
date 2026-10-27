import type { Role } from '../types';

/**
 * Browser stand-in for the server's bcrypt + jsonwebtoken layer.
 * The API surface mirrors the Node implementation 1:1 so the Express
 * controllers can drop in unchanged:
 *   hashPassword  -> bcrypt.hash(password, 10)
 *   comparePassword -> bcrypt.compare(password, hash)
 *   signToken     -> jwt.sign(payload, JWT_SECRET, { expiresIn })
 *   verifyToken   -> jwt.verify(token, JWT_SECRET)
 */

const SALT = 'uniride$2b$10$';
const JWT_SECRET = 'uniride-dev-secret';

function digest(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = (h1 ^ c) >>> 0;
    h1 = h1 * 16777619 >>> 0;
    h2 = h2 + c * (i + 7) >>> 0;
    h2 = (h2 ^ h2 << 5) >>> 0;
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export function hashPassword(password: string): string {
  return `${SALT}${digest(SALT + password)}${digest(password + SALT)}`;
}

export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  email: string;
  iat: number;
  exp: number;
}

function b64(value: string): string {
  return btoa(unescape(encodeURIComponent(value))).
  replace(/\+/g, '-').
  replace(/\//g, '_').
  replace(/=+$/, '');
}

function unb64(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(padded)));
}

export function signToken(
payload: Pick<JwtPayload, 'sub' | 'role' | 'email'>,
ttlSeconds = 60 * 60 * 8)
: string {
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64(
    JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds })
  );
  const signature = digest(`${header}.${body}.${JWT_SECRET}`);
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string | null): JwtPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  if (digest(`${header}.${body}.${JWT_SECRET}`) !== signature) return null;
  try {
    const payload = JSON.parse(unb64(body)) as JwtPayload;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}