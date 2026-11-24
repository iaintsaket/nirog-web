"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { RecentMedicine, User } from "@/api/client";
import { currentUser, signOut } from "@/services/account";
import { clearRecent, recordRecent } from "@/services/recent";
import { signInEnabled } from "./signInFlag";

type AuthState = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  forget: () => void;
  /** The last medicines this user opened, newest first (empty when signed out). */
  recent: RecentMedicine[];
  /** Records an opened medicine; does nothing when signed out or when it is already the newest. */
  opened: (key: string, label: string, offerId?: string) => void;
  clearRecent: () => Promise<void>;
};

const RECENT_LIMIT = 3;

const AuthContext = createContext<AuthState>({
  user: null,
  loading: false,
  signOut: async () => {},
  forget: () => {},
  recent: [],
  opened: () => {},
  clearRecent: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(signInEnabled);

  useEffect(() => {
    if (!signInEnabled()) return;
    let live = true;
    currentUser().then((r) => {
      if (!live) return;
      setUser(r.ok ? r.data : null);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  const doSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);
  const forget = useCallback(() => setUser(null), []);

  // A layout effect runs before any child's useEffect, so `opened` always sees the current user.
  const latest = useRef(user);
  useLayoutEffect(() => {
    latest.current = user;
  }, [user]);
  const opened = useCallback((key: string, label: string, offerId?: string) => {
    const u = latest.current;
    if (!u || !label || u.recent[0]?.key === key) return;
    const top: RecentMedicine = { key, label, offer_id: offerId ?? null, opened_at: new Date().toISOString() };
    latest.current = { ...u, recent: [top, ...u.recent.filter((r) => r.key !== key)].slice(0, RECENT_LIMIT) };
    setUser(latest.current);
    void recordRecent(key, label, offerId);
  }, []);
  const doClearRecent = useCallback(async () => {
    const r = await clearRecent();
    if (r.ok) setUser((u) => (u ? { ...u, recent: [] } : u));
  }, []);

  const recent = user?.recent ?? [];
  return (
    <AuthContext.Provider
      value={{ user, loading, signOut: doSignOut, forget, recent, opened, clearRecent: doClearRecent }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
