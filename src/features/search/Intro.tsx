import { BackdropArt } from "./BackdropArt";
import { HeroArt } from "./HeroArt";
import { lineUp } from "@/ui/motion";

export const PLACEHOLDER = "e.g. Dolo 650, Atorvastatin 10, Pan 40";

/** The home heading and lede, shared by the live search and its pre-rendered stand-in. */
export function SearchHero() {
  return (
    <section className="search-hero">
      <div className="intro" style={lineUp(0)}>
        <HeroArt />
      </div>
      <h1 className="intro" style={lineUp(1)}>
        Pay less for the same medicine
      </h1>
      <p className="lede intro" style={lineUp(2)}>
        Same salts, strength and form, from Jan Aushadhi and other brands, with what you could save.
      </p>
    </section>
  );
}

export function SearchTrust() {
  return (
    <ul className="search-trust plain intro" style={lineUp(4)} aria-label="About the prices">
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
        <form role="search" action="/" method="get" className="search-form intro" style={lineUp(3)}>
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
