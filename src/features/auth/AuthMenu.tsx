"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { compareHref } from "@/lib/medicines";
import { useAuth } from "./AuthProvider";
import { signInEnabled } from "./signInFlag";

/** "Asha Rao" → "Asha"; falls back to the email's name part. */
const firstName = (name: string, email: string) => (name.trim() || email.split("@")[0]).split(/\s+/)[0];

/**
 * Signed in: the Google picture (or the first letter) and the first name. Clicking opens a menu
 * with Saved and Sign out. It closes on Escape, on a click outside, or after choosing.
 */
export function AuthMenu() {
  const { user, loading, signOut, recent } = useAuth();
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
          <p className="account-email small muted" title={user.email}>
            {user.email}
          </p>
          <Link role="menuitem" className="account-item" href="/saved" onClick={() => setOpen(false)}>
            Saved
          </Link>
          {recent.length > 0 && (
            <>
              <p className="account-section small muted" aria-hidden="true">
                Recent
              </p>
              {recent.map((r) => (
                <Link
                  key={r.key}
                  role="menuitem"
                  className="account-item account-recent"
                  href={compareHref(r.key, r.offer_id ?? undefined)}
                  title={r.label}
                  onClick={() => setOpen(false)}
                >
                  {r.label}
                </Link>
              ))}
            </>
          )}
          <button
            role="menuitem"
            type="button"
            className="account-item"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
