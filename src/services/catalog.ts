import { api, type Comparison, type SearchGroup } from "@/api/client";
import { call, type Result } from "./result";

export type SearchResult = { groups: SearchGroup[]; didYouMean: string[] };

export function searchMedicines(q: string): Promise<Result<SearchResult>> {
  return call(() => api.GET("/v1/search", { params: { query: { q } } })).then((r) =>
    r.ok ? { ok: true, data: { groups: r.data.groups, didYouMean: r.data.did_you_mean } } : r,
  );
}

export function compareMatch(key: string, searched?: string): Promise<Result<Comparison>> {
  return call(() =>
    api.GET("/v1/compare", { params: { query: { key, ...(searched ? { searched } : {}) } } }),
  );
}
