"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { BrandAlias, SearchGroup } from "@/api/client";
import { CompareView } from "@/features/compare/CompareView";
import { shortUnitPrice } from "@/lib/format";
import { searchMedicines } from "@/services/catalog";
import { BackdropArt } from "./BackdropArt";
import { HeroArt } from "./HeroArt";
import { HomeStats } from "./HomeStats";
import { Loading } from "@/ui/Pulse";
import { HOME_EVENT } from "./HomeLink";

/** The page splits into list + prices once the query has this many characters. */
const MIN = 2;
const MAX = 100;
/** Wait this long after the last keystroke (or arrow key) before calling the API. */
const DEBOUNCE_MS = 150;

type State =
  | { kind: "loading" }
  | { kind: "done"; groups: SearchGroup[]; didYouMean: string[]; sameSaltAs: BrandAlias | null }
  | { kind: "error"; message: string };

export function compareHref(key: string, searched?: string): string {
  const p = new URLSearchParams({ key });
  if (searched) p.set("searched", searched);
  return `/compare?${p.toString()}`;
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [text, setText] = useState(params.get("q") ?? "");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [sel, setSel] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const typed = text.trim();
  const split = typed.length >= MIN;
  const q = useDebounced(typed, DEBOUNCE_MS);
  const groups = state.kind === "done" ? state.groups : [];
  const picked = split ? groups[sel] : undefined;
  const pickedKey = useDebounced(picked ? `${picked.key}\n${picked.matched[0]?.id ?? ""}` : "", DEBOUNCE_MS);

  useEffect(() => {
    router.replace(q.length >= MIN ? `/?q=${encodeURIComponent(q)}` : "/", { scroll: false });
    if (q.length < MIN) return;
    let live = true;
    // Keep the last results on screen while the next ones load, so the list doesn't flicker.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for a new query
    setState((s) => (s.kind === "done" ? s : { kind: "loading" }));
    searchMedicines(q).then((r) => {
      if (!live) return;
      setSel(0);
      setState(r.ok ? { kind: "done", ...r.data } : { kind: "error", message: r.message });
    });
    return () => {
      live = false;
    };
  }, [q, router]);

  function clear() {
    setText("");
    setSheetOpen(false);
    setState({ kind: "loading" });
  }

  useEffect(() => {
    window.addEventListener(HOME_EVENT, clear);
    return () => window.removeEventListener(HOME_EVENT, clear);
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (sheetOpen) setSheetOpen(false);
      else clear();
      return;
    }
    if (!split || groups.length === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setSheetOpen(false);
      setSel((i) => (i + step + groups.length) % groups.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      setSheetOpen(true);
    }
  }

  const [detailKey, detailSearched] = pickedKey.split("\n");
  const expanded = split && groups.length > 0;

  return (
    <div className={`search-shell${split ? " is-split" : ""}${sheetOpen ? " sheet-open" : ""}`}>
      <BackdropArt />
      <div className="search-left">
        <section className="search-hero">
          <div className="intro" style={{ "--i": 0 } as CSSProperties}>
            <HeroArt />
          </div>
          <h1 className="intro" style={{ "--i": 1 } as CSSProperties}>
            Pay less for the same medicine
          </h1>
          <p className="lede intro" style={{ "--i": 2 } as CSSProperties}>
            Same salts, strength and form, from Jan Aushadhi and other brands, with what you could save.
          </p>
        </section>
        <form role="search" className="search-form intro" style={{ "--i": 3 } as CSSProperties} onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="q" className="visually-hidden">
            Medicine name or salt
          </label>
          <input
            id="q"
            name="q"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls="search-results"
            aria-activedescendant={expanded ? `result-${sel}` : undefined}
            placeholder="e.g. Dolo 650, Atorvastatin 10, Pan 40"
            maxLength={MAX}
            autoComplete="off"
            spellCheck={false}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSheetOpen(false);
            }}
            onKeyDown={onKeyDown}
          />
          {text && (
            <button type="button" className="search-clear" aria-label="Clear search" onClick={clear}>
              ✕
            </button>
          )}
        </form>
        {!split && (
          <ul className="search-trust plain intro" style={{ "--i": 4 } as CSSProperties} aria-label="About the prices">
            <li>Government Jan Aushadhi prices</li>
            <li>No ads or tie-ups</li>
          </ul>
        )}
        {!split && <HomeStats />}
        {split && (
          <ResultsList
            q={typed}
            state={state}
            sel={sel}
            picked={sheetOpen}
            onShowAll={() => setSheetOpen(false)}
            onPick={(i) => {
              setSel(i);
              setSheetOpen(true);
            }}
            onSuggest={setText}
          />
        )}
      </div>

      <section className="search-right" aria-label="Prices">
        <div className="sheet-bar">
          <span className="sheet-grab" aria-hidden="true" />
          <button type="button" className="button button-quiet" onClick={() => setSheetOpen(false)}>
            Close
          </button>
        </div>
        {split && detailKey && (
          <CompareView key={pickedKey} matchKey={detailKey} searched={detailSearched || undefined} headingLevel="h2" />
        )}
      </section>
    </div>
  );
}

type ListProps = {
  q: string;
  state: State;
  sel: number;
  /** A medicine was picked: show only it, with a way back to the rest. */
  picked: boolean;
  onShowAll: () => void;
  onPick: (i: number) => void;
  onSuggest: (name: string) => void;
};

function ResultsList({ q, state, sel, picked, onShowAll, onPick, onSuggest }: ListProps) {
  if (state.kind === "loading") {
    return (
      <Loading>Searching…</Loading>
    );
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
      <div className="notice stack-sm not-found">
        <p>
          <strong>We don&apos;t have “{q}” yet.</strong> Our prices come from public lists that miss
          some brands.
        </p>
        {state.didYouMean.length > 0 && (
          <div className="stack-sm">
            <p className="small muted">Did you mean</p>
            <ul className="suggestions plain">
              {state.didYouMean.map((name) => (
                <li key={name}>
                  <button type="button" className="chip" onClick={() => onSuggest(name)}>
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="small muted">
          Or search the salt printed on the strip, for example “Aspirin” or “Paracetamol”, to see
          cheaper medicines with the same contents.
        </p>
      </div>
    );
  }
  const alias = state.sameSaltAs;
  return (
    <>
      {alias ? (
        <SameSaltNote alias={alias} exact={state.groups.some((g) => g.key === alias.key)} />
      ) : (
        <p className="results-note" aria-live="polite">
          {state.groups.length} medicine{state.groups.length === 1 ? "" : "s"} match “{q}”
        </p>
      )}
      <ul id="search-results" role="listbox" aria-label="Matching medicines" className="results plain">
        {state.groups.map((g, i) => {
          if (picked && i !== sel) return null;
          const first = g.matched[0];
          const more = g.matched.length - 1;
          return (
            <li
              key={g.key}
              id={`result-${i}`}
              role="option"
              aria-selected={i === sel}
              className="result card-in"
              style={{ "--i": picked ? 0 : Math.min(i, 10) } as CSSProperties}
              onClick={() => onPick(i)}
            >
              <span className="result-main">
                <strong>{first?.name ?? g.salts_label}</strong>
                {more > 0 && <span className="muted small"> +{more} more</span>}
                <span className="result-salts">{g.salts_label}</span>
                {alias?.key === g.key && <span className="badge badge-exact">Same strength</span>}
              </span>
              {first && (
                <span className="result-price">{shortUnitPrice(first.unit_price_millipaise, first.pack_unit)}</span>
              )}
            </li>
          );
        })}
      </ul>
      {picked && state.groups.length > 1 && (
        <button type="button" className="show-all card-in" onClick={onShowAll}>
          Show all {state.groups.length} medicines
        </button>
      )}
    </>
  );
}

function SameSaltNote({ alias, exact }: { alias: BrandAlias; exact: boolean }) {
  return (
    <div className="notice stack-sm same-salt" aria-live="polite">
      <p>
        We don&apos;t have {alias.brand}&apos;s price. These medicines have the same salt ({alias.salts_label}).
      </p>
      {!exact && (
        <p className="small muted">
          None of these is {alias.salts_label}; they have a different strength. Ask your pharmacist before switching.
        </p>
      )}
    </div>
  );
}
