import { useEffect, useState } from 'react';

/**
 * The logged in user's session, kept in localStorage so a refresh doesn't log them out.
 * The token comes from POST /api/login or /api/register and is sent with every API request.
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface Session {
  token: string;
  user: SessionUser;
}

const STORAGE_KEY = 'stridex-session';
const CHANGE_EVENT = 'stridex-session-change';

export function getSession(): Session | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved == null ? null : (JSON.parse(saved) as Session);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * React hook for the logged in user, or null. Re-renders on login and logout.
 */
export function useCurrentUser(): SessionUser | null {
  const [user, setUser] = useState(() => getSession()?.user ?? null);

  useEffect(() => {
    const update = () => setUser(getSession()?.user ?? null);
    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener('storage', update); // other tabs
    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return user;
}
