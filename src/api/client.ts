import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

export type Schemas = components["schemas"];
export type Offer = Schemas["OfferDto"];
export type SearchGroup = Schemas["SearchGroupDto"];
export type BrandAlias = Schemas["BrandAliasDto"];
export type Stats = Schemas["StatsResponse"];
export type Comparison = Schemas["ComparisonResponse"];
export type BuyLink = Schemas["BuyLinkDto"];
export type User = Schemas["UserDto"];
export type SavedMatch = Schemas["SavedMatchDto"];

/** Typed client generated from the API's openapi.json. Same-origin: /v1 is proxied. */
export const api = createClient<paths>({
  baseUrl: typeof window === "undefined" ? "http://localhost" : window.location.origin,
  credentials: "same-origin",
  // Resolve fetch at call time so tests can stub it.
  fetch: (request: Request) => globalThis.fetch(request),
});
