"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { BuyLink, Offer, VendorStatus } from "@/api/client";
import { CompareDialog } from "./CompareDialog";

/** At most this many medicines can be added to one comparison (besides yours). */
export const MAX_COMPARE = 3;

export type CompareItem = { offer: Offer; links: BuyLink[]; vendors?: VendorStatus[] };

type Ctx = {
  /** Your medicine: every other card compares against it. */
  mine: Offer;
  show: (items: CompareItem[]) => void;
  toggle: (item: CompareItem) => void;
  added: (id: string) => boolean;
  full: boolean;
};

const CompareCtx = createContext<Ctx | null>(null);

/** Null outside a CompareProvider: cards then render without compare actions. */
export function useCompare(): Ctx | null {
  return useContext(CompareCtx);
}

/**
 * Gives every medicine card inside it the same compare features: click to compare with yours,
 * "+ Compare" into a tray of up to MAX_COMPARE, and the comparison window.
 */
export function CompareProvider({ mine, form, children }: { mine: Offer; form?: string; children: ReactNode }) {
  const [picks, setPicks] = useState<CompareItem[]>([]);
  const [open, setOpen] = useState<CompareItem[] | null>(null);
  const ctx: Ctx = {
    mine,
    show: setOpen,
    toggle: (item) =>
      setPicks((p) =>
        p.some((x) => x.offer.id === item.offer.id)
          ? p.filter((x) => x.offer.id !== item.offer.id)
          : p.length < MAX_COMPARE
            ? [...p, item]
            : p,
      ),
    added: (id) => picks.some((x) => x.offer.id === id),
    full: picks.length >= MAX_COMPARE,
  };
  return (
    <CompareCtx.Provider value={ctx}>
      {children}
      {picks.length > 0 && (
        <div className="compare-tray card-in" role="region" aria-label="Compare tray">
          <span className="small">
            {picks.length} of {MAX_COMPARE} added
          </span>
          <button type="button" className="button" onClick={() => setOpen(picks)}>
            Compare {picks.length + 1} medicines
          </button>
          <button type="button" className="link-button" onClick={() => setPicks([])}>
            Clear
          </button>
        </div>
      )}
      {open && <CompareDialog mine={mine} others={open} form={form} onClose={() => setOpen(null)} />}
    </CompareCtx.Provider>
  );
}
