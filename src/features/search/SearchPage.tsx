"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { SearchGroup } from "@/api/client";
import { searchMedicines } from "@/services/catalog";
import { OfferSummary } from "./OfferSummary";

const MIN = 2;
const MAX = 100;
const SHOWN_PER_GROUP = 3;

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; groups: SearchGroup[] }
  | { kind: "error"; message: string };

export function compareHref(key: string, searched?: string): string {
  const p = new URLSearchParams({ key });
  if (searched) p.set("searched", searched);
  return `/compare?${p.toString()}`;
}

export function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const [text, setText] = useState(q);
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    if (q.length < MIN) return;
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for a new query
    setState({ kind: "loading" });
    searchMedicines(q).then((r) => {
      if (!live) return;
      setState(r.ok ? { kind: "done", groups: r.data } : { kind: "error", message: r.message });
    });
    return () => {
      live = false;
    };
  }, [q]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = text.trim();
    if (next.length >= MIN) router.push(`/?q=${encodeURIComponent(next)}`);
  }

  return (
    <div className="stack-lg">
      <section className="hero stack">
        <h1>Pay less for the same medicine</h1>
        <p className="lede">
          Search a medicine you buy. Nirog finds exact substitutes, with the same salts, strength and
          form, from Jan Aushadhi and other brands, and shows what you could save.
        </p>
        <form role="search" className="search-form" onSubmit={onSubmit}>
          <label htmlFor="q" className="visually-hidden">
            Medicine name or salt
          </label>
          <input
            id="q"
            name="q"
            type="search"
            placeholder="e.g. Dolo 650, Atorvastatin 10, Pan 40"
            minLength={MIN}
            maxLength={MAX}
            autoComplete="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="button button-primary" disabled={text.trim().length < MIN}>
            Search
          </button>
        </form>
      </section>

      {q.length >= MIN && <Results q={q} state={state} />}
    </div>
  );
}

function Results({ q, state }: { q: string; state: State }) {
  if (state.kind === "loading" || state.kind === "idle") {
    return <p aria-busy="true">Searching…</p>;
  }
  if (state.kind === "error") {
    return (
      <p role="alert" className="notice notice-error">
        {state.message}
      </p>
    );
  }
  if (state.groups.length === 0) {
    return (
      <p className="notice">
        No medicines match <strong>{q}</strong>. Try the brand name as printed on the strip, or the
        salt name.
      </p>
    );
  }
  return (
    <section aria-label="Search results" className="stack">
      <h2 className="h3">
        {state.groups.length} medicine{state.groups.length === 1 ? "" : "s"} matching “{q}”
      </h2>
      <ul className="cards">
        {state.groups.map((g) => (
          <li key={g.key} className="card stack-sm">
            <div className="salts">{g.salts_label}</div>
            <ul className="plain stack-sm">
              {g.matched.slice(0, SHOWN_PER_GROUP).map((o) => (
                <li key={o.id}>
                  <Link className="offer-link" href={compareHref(g.key, o.id)}>
                    <OfferSummary offer={o} />
                  </Link>
                </li>
              ))}
            </ul>
            {g.matched.length > SHOWN_PER_GROUP && (
              <div className="muted small">
                and {g.matched.length - SHOWN_PER_GROUP} more matching “{q}”
              </div>
            )}
            <Link className="button button-primary" href={compareHref(g.key, g.matched[0]?.id)}>
              Compare cheaper options
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
