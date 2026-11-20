import { api, type BrandAlias, type Comparison, type SearchGroup, type Stats, type CloseMatch } from "@/api/client";
import { call, type Result } from "./result";

/** `sameSaltAs` is set when the query is a brand we have no price for; `groups` then share its salt. */
export type SearchResult = { groups: SearchGroup[]; didYouMean: string[]; sameSaltAs: BrandAlias | null };

export function searchMedicines(q: string): Promise<Result<SearchResult>> {
  return call(() => api.GET("/v1/search", { params: { query: { q } } })).then((r) =>
    r.ok ? { ok: true, data: { groups: r.data.groups, didYouMean: r.data.did_you_mean, sameSaltAs: r.data.same_salt_as ?? null } } : r,
  );
}

export function compareMatch(key: string, searched?: string): Promise<Result<Comparison>> {
  return call(() =>
    api.GET("/v1/compare", { params: { query: { key, ...(searched ? { searched } : {}) } } }),
  );
}

/** Headline figures for the home screen. */
export function catalogStats(): Promise<Result<Stats>> {
  return call(() => api.GET("/v1/stats"));
}

/** Nearby formulas when there is no cheaper exact substitute. Not substitutes. */
export function closeMatches(key: string): Promise<Result<CloseMatch[]>> {
  return call(() => api.GET("/v1/close", { params: { query: { key } } })).then((r) =>
    r.ok ? { ok: true, data: r.data.matches } : r,
  );
}
