import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from
  'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { PublicUser, Role, VerificationStatus } from '../types';
import { api, type MeResponse } from '../services/api';
import { onUnauthorized } from '../services/http';
import { tokenStore } from '../services/tokenStore';
import { socket } from '../server/socket';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  verification: { student: VerificationStatus; driver: VerificationStatus; };
  studentApproved: boolean;
  driverApproved: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<PublicUser>;
  signup: (payload: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    confirm_password: string;
    role: Exclude<Role, 'admin'>;
  }) => Promise<PublicUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const dashboardPath: Record<Role, string> = {
  passenger: '/passenger/dashboard',
  driver: '/driver/dashboard',
  admin: '/admin/dashboard'
};

const emptyVerification = {
  student: 'not_submitted' as VerificationStatus,
  driver: 'not_submitted' as VerificationStatus
};

export function AuthProvider({ children }: { children: React.ReactNode; }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<MeResponse | null>(null);
  const loggingOut = useRef(false);

  const applySession = useCallback((next: MeResponse) => {
    setSession(next);
    setStatus('authenticated');
    socket.connect(next.user.id);
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setSession(null);
    setStatus('unauthenticated');
    socket.disconnect();
  }, []);

  /** Validate the stored JWT on every app load / refresh. */
  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      clearSession();
      return;
    }
    try {
      const me = await api.auth.me();
      applySession(me);
    } catch {
      clearSession();
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Axios response-interceptor hook: any 401 ends the session immediately. */
  useEffect(
    () =>
      onUnauthorized(() => {
        if (loggingOut.current) return;
        clearSession();
        toast.error('Your session expired. Please sign in again.');
        navigate('/login', { replace: true });
      }),
    [clearSession, navigate]
  );

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const result = await api.auth.login({ email, password });
      tokenStore.set(result.token, remember);
      const verification = result.verification ?? {
        student: 'not_submitted',
        driver: 'not_submitted'
      };

      applySession({
        user: result.user,
        verification,
        studentApproved: verification.student === 'approved',
        driverApproved: verification.driver === 'approved'
      });
      return result.user;
    },
    [applySession]
  );

  const signup = useCallback<AuthContextValue['signup']>(
    async (payload) => {
      const result = await api.auth.register(payload);
      tokenStore.set(result.token, true);
      applySession({
        user: result.user,
        verification: result.verification,
        studentApproved: false,
        driverApproved: false
      });
      return result.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    loggingOut.current = true;

    void api.auth
      .logout()
      .catch(() => {
        // Local logout must still complete if the server is unavailable.
      })
      .finally(() => {
        clearSession();
        navigate('/login', { replace: true });
        toast.success('You have been signed out.');

        window.setTimeout(() => {
          loggingOut.current = false;
        }, 300);
      });
  }, [clearSession, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      verification: session?.verification ?? emptyVerification,
      studentApproved: session?.studentApproved ?? false,
      driverApproved: session?.driverApproved ?? false,
      login,
      signup,
      logout,
      refresh
    }),
    [status, session, login, signup, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}