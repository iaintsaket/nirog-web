import type { CSSProperties } from "react";
import { BackdropArt } from "./BackdropArt";
import { HeroArt } from "./HeroArt";

export const PLACEHOLDER = "e.g. Dolo 650, Atorvastatin 10, Pan 40";

/** The home heading and lede, shared by the live search and its pre-rendered stand-in. */
export function SearchHero() {
  return (
    <section className="search-hero">
      <div className="intro" style={{ "--i": 0 } as CSSProperties}>
        <HeroArt />
      </div>
      <h1 className="intro" style={{ "--i": 1 } as CSSProperties}>
        Health for everyone, everywhere
      </h1>
      <p className="lede intro" style={{ "--i": 2 } as CSSProperties}>
        Find the exact medicine you need, with the same salts, strength and form, wherever it's available and at a price you can manage.
      </p>
    </section>
  );
}

export function SearchTrust() {
  return (
    <ul className="search-trust plain intro" style={{ "--i": 4 } as CSSProperties} aria-label="About the prices">
      <li>Government Jan Aushadhi prices</li>
      <li>No ads or tie-ups</li>
    </ul>
  );
}

/**
 * The home page as it is built ahead of time, before the browser has read `?q=`. Same markup and
 * classes as SearchPage's resting state, so search engines and no-JS visitors get the real heading
 * and a working search (a plain GET to `/?q=`), and the swap to the live page is invisible.
 */
export function SearchFallback() {
  return (
    <div className="search-shell">
      <BackdropArt />
      <div className="search-left">
        <SearchHero />
        <form role="search" action="/" method="get" className="search-form intro" style={{ "--i": 3 } as CSSProperties}>
          <label htmlFor="q" className="visually-hidden">
            Medicine name or salt
          </label>
          <input id="q" name="q" type="text" placeholder={PLACEHOLDER} maxLength={100} autoComplete="off" spellCheck={false} />
        </form>
        <SearchTrust />
      </div>
    </div>
  );
}
