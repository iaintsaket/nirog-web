"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Stats } from "@/api/client";
import { catalogStats } from "@/services/catalog";

const count = new Intl.NumberFormat("en-IN");
const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const COUNT_UP_MS = 1100;

/** Each card: its label, the number to count up to, and how to show it. Add a card by adding an entry. */
const CARDS: { label: string; value: (s: Stats) => number; show: (n: number) => string }[] = [
  { label: "Medicines we know", value: (s) => s.medicines, show: (n) => count.format(n) },
  { label: "Jan Aushadhi medicines", value: (s) => s.jan_aushadhi, show: (n) => count.format(n) },
  { label: "Have a cheaper exact substitute", value: (s) => s.with_cheaper_substitute, show: (n) => count.format(n) },
  { label: "Typical saving", value: (s) => Math.floor(s.median_saving_bps / 100), show: (n) => `${n}%` },
];

function prefersStill(): boolean {
  return typeof window.matchMedia !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Counts from 0 to 1 over COUNT_UP_MS, eased, and again each time `run` changes.
 * Jumps straight to 1 when motion is unwanted.
 */
function useProgress(run: number): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (prefersStill()) return;
    let frame = 0;
    const start = performance.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restart the count from zero
    setP(0);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      setP(1 - (1 - t) ** 3);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Frames pause in background tabs; never leave the figures stuck part-way.
    const done = setTimeout(() => setP(1), COUNT_UP_MS + 300);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
    };
  }, [run]);
  // Without motion the final numbers show on the first render, with no flash of zeros.
  return prefersStill() ? 1 : p;
}

/** Live figures about our prices for the empty search screen. Shows nothing if they fail to load. */
export function HomeStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    let live = true;
    catalogStats().then((r) => live && r.ok && setStats(r.data));
    return () => {
      live = false;
    };
  }, []);
  if (!stats) return null;
  return (
    <section className="home-stats" aria-label="Our prices in numbers">
      <dl className="home-stats-grid">
        {CARDS.map((c, i) => (
          <StatCard key={c.label} label={c.label} order={i} text={(p) => c.show(Math.round(c.value(stats) * p))} />
        ))}
      </dl>
      {stats.prices_updated_on && (
        <p className="small muted home-stats-date">
          Prices updated {day.format(new Date(`${stats.prices_updated_on}T00:00:00Z`))}
        </p>
      )}
    </section>
  );
}

/** One figure. It counts up when it first appears and again whenever it is hovered. */
function StatCard({ label, order, text }: { label: string; order: number; text: (p: number) => string }) {
  const [run, setRun] = useState(0);
  const p = useProgress(run);
  return (
    <div className="home-stat card-in" style={{ "--i": order } as CSSProperties} onMouseEnter={() => setRun((n) => n + 1)}>
      <dt>{label}</dt>
      <dd>{text(p)}</dd>
    </div>
  );
}
