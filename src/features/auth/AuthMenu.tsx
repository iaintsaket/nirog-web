"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { signInEnabled } from "./signInFlag";

/** "Asha Rao" → "Asha"; falls back to the email's name part. */
const firstName = (name: string, email: string) => (name.trim() || email.split("@")[0]).split(/\s+/)[0];

/**
 * Signed in: the Google picture (or the first letter) and the first name. Clicking opens a menu
 * with Saved and Sign out. It closes on Escape, on a click outside, or after choosing.
 */
export function AuthMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  if (!signInEnabled()) return null;
  if (loading) return <span className="muted small" aria-busy="true">…</span>;
  if (!user) {
    return (
      <Link className="button button-quiet" href="/signin">
        Sign in
      </Link>
    );
  }

  const first = firstName(user.name, user.email);
  return (
    <div className="auth-menu" ref={wrap}>
      <button
        ref={toggle}
        type="button"
        className="account-toggle"
        aria-label={`Account menu for ${user.name || user.email}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {user.picture_url ? (
          // Google's image host; no referrer so the picture loads and nothing about the page leaks.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar" src={user.picture_url} alt="" width={28} height={28} referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar avatar-initial" aria-hidden="true">
            {first.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="account-name">{first}</span>
        <svg className="account-caret" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>
      {open && (
        <div className="account-dropdown" role="menu" id={menuId} aria-label="Account">
          <p className="account-head" title={user.email}>
            {user.name && <strong>{user.name}</strong>}
            <span>{user.email}</span>
          </p>
          <Link role="menuitem" className="account-item" href="/saved" onClick={() => setOpen(false)}>
            Saved
          </Link>
          <button
            role="menuitem"
            type="button"
            className="account-item account-signout"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            <svg className="signout-icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path className="signout-door" d="M8 3.5H5.5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2H8" />
              <g className="signout-arrow">
                <path d="M8.5 10h8" />
                <path d="m13.5 6.5 3.5 3.5-3.5 3.5" />
              </g>
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
