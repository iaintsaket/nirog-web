import { api, type SavedMatch } from "@/api/client";
import { call, type Result } from "./result";

export function listSaved(): Promise<Result<SavedMatch[]>> {
  return call(() => api.GET("/v1/saved"));
}

export function saveMatch(key: string, label: string, offerId?: string): Promise<Result<SavedMatch>> {
  return call(() =>
    api.POST("/v1/saved", { body: { key, label, ...(offerId ? { offer_id: offerId } : {}) } }),
  );
}

export function removeSaved(id: string): Promise<Result<unknown>> {
  return call(() => api.DELETE("/v1/saved/{id}", { params: { path: { id } } }));
}
