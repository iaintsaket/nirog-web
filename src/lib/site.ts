/**
 * Where the site lives and how it describes itself to search engines. Moving to a custom domain
 * is one value: set NEXT_PUBLIC_SITE_URL at build time.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nirog.pages.dev").replace(/\/+$/, "");
export const SITE_NAME = "Nirog";
export const SITE_TITLE = "Nirog: health for everyone, everywhere";
export const SITE_DESCRIPTION =
  "Find the exact medicine you need, with the same salts, strength and form, from Jan Aushadhi and other makers: where it's available and at a price you can manage.";

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
