"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function AuthMenu() {
  const { user, loading, signOut } = useAuth();
  if (loading) return <span className="muted small" aria-busy="true">…</span>;
  if (!user) {
    return (
      <Link className="button button-quiet" href="/signin">
        Sign in
      </Link>
    );
  }
  return (
    <div className="auth-menu">
      <Link href="/saved">Saved</Link>
      <span className="muted small" title={user.email}>
        {user.name || user.email}
      </span>
      <button type="button" className="button button-quiet" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}
