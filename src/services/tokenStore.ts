const KEY = 'uniride.token';

/**
 * Single source of truth for the JWT. "Remember me" persists to localStorage,
 * otherwise the token only lives for the browser session.
 */
export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  },
  set(token: string, remember: boolean): void {
    tokenStore.clear();
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
  },
  clear(): void {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  }
};