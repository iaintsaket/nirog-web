import type { Metadata } from "next";

/**
 * Where the site lives and how it describes itself to search engines. Moving to a custom domain
 * is one value: set NEXT_PUBLIC_SITE_URL at build time.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nirog.pages.dev").replace(/\/+$/, "");
export const SITE_NAME = "Nirog";
export const SITE_TITLE = "Nirog: health for everyone, everywhere";
export const SITE_DESCRIPTION =
  "Find the exact medicine you need, with the same salts, strength and form, from Jan Aushadhi and other makers: where it’s available and at a price you can manage.";

/** Added to every page title by the layout's template. */
export const TITLE_SUFFIX = " · Nirog";
/** Google shows about this many characters of a title before cutting it off. */
const TITLE_MAX = 70;

/**
 * Canonical and share tags for an indexable page. Next replaces a layout's openGraph and twitter
 * objects instead of merging them, so each page states them in full here, with its own URL; else
 * a shared link previews as the home page. A title too long for the suffix drops it.
 */
export function pageMeta({ path, title, description, suffix = true }: { path: string; title: string; description: string; suffix?: boolean }): Metadata {
  const keepSuffix = suffix && (title + TITLE_SUFFIX).length <= TITLE_MAX;
  const shown = keepSuffix ? title + TITLE_SUFFIX : title.length <= TITLE_MAX ? title : `${title.slice(0, TITLE_MAX - 1)}…`;
  return {
    title: keepSuffix ? title : { absolute: shown },
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN", url: path, title: shown, description },
    twitter: { card: "summary_large_image", title: shown, description },
  };
}

/** Absolute URL for a site path, as canonical links, sitemaps and structured data need. */
export function absolute(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Serialises JSON-LD for an inline script; escaping `<` keeps the data from closing the tag. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Structured data for the home page: the site, its search, and who runs it. */
export function homeJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absolute("/#website"),
        url: absolute("/"),
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en-IN",
        publisher: { "@id": absolute("/#org") },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${absolute("/")}?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": absolute("/#org"),
        name: SITE_NAME,
        url: absolute("/"),
        logo: absolute("/icon.svg"),
        sameAs: ["https://github.com/iaintsaket/nirog-web"],
      },
    ],
  };
}

/** Structured data for /about: an AboutPage about the Organization the home page describes. */
export function aboutJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": absolute("/about#page"),
    url: absolute("/about"),
    name: "About Nirog",
    inLanguage: "en-IN",
    isPartOf: { "@id": absolute("/#website") },
    about: { "@id": absolute("/#org") },
  };
}
