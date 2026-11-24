"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

/** "About" beside the logo: Our mission and About us. Closes on Escape, a click outside or a choice. */
export function AboutMenu() {
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

  return (
    <div className="about-menu" ref={wrap}>
      <button
        ref={toggle}
        type="button"
        className="about-toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        About
        <svg className="account-caret" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>
      {open && (
        <div className="account-dropdown about-dropdown" role="menu" id={menuId} aria-label="About">
          <Link role="menuitem" className="account-item" href="/about#mission" onClick={() => setOpen(false)}>
            Our mission
          </Link>
          <Link role="menuitem" className="account-item" href="/about" onClick={() => setOpen(false)}>
            About us
          </Link>
        </div>
      )}
    </div>
  );
}
