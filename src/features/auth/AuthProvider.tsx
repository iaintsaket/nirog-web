"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/api/client";
import { currentUser, signOut } from "@/services/account";
import { signInEnabled } from "./signInFlag";

type AuthState = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  forget: () => void;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: false,
  signOut: async () => {},
  forget: () => {},
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

  return (
    <AuthContext.Provider value={{ user, loading, signOut: doSignOut, forget }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
