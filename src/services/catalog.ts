import { api, type Comparison, type SearchGroup } from "@/api/client";
import { call, type Result } from "./result";

export function searchMedicines(q: string): Promise<Result<SearchGroup[]>> {
  return call(() => api.GET("/v1/search", { params: { query: { q } } })).then((r) =>
    r.ok ? { ok: true, data: r.data.groups } : r,
  );
}

export function compareMatch(key: string, searched?: string): Promise<Result<Comparison>> {
  return call(() =>
    api.GET("/v1/compare", { params: { query: { key, ...(searched ? { searched } : {}) } } }),
  );
}
