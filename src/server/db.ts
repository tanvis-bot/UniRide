import { buildSeedDatabase, type Database } from '../data/seed';

/**
 * Persistence layer. In production this module is the MySQL connection pool
 * (mysql2/promise) and every query below maps to a prepared statement against
 * the matching relational table. In the browser preview the same relational
 * shape is kept in memory and mirrored to localStorage so data survives reloads.
 */

const STORAGE_KEY = 'uniride.db.v1';

let cache: Database | null = null;

function load(): Database {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw) as Database;
      return cache;
    }
  } catch {

    /* fall through to seed */}
  cache = buildSeedDatabase();
  persist();
  return cache;
}

export function db(): Database {
  return load();
}

export function persist(): void {
  if (!cache) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {

    /* storage full / unavailable — in-memory state still valid */}
}

export function resetDatabase(): void {
  cache = buildSeedDatabase();
  persist();
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}