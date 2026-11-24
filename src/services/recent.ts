import { api } from "@/api/client";
import { call, type Result } from "./result";

/** Tells the API this signed-in user opened a medicine; it moves to the top of their recent list. */
export function recordRecent(key: string, label: string, offerId?: string): Promise<Result<unknown>> {
  return call(() =>
    api.POST("/v1/me/recent", { body: { key, label, ...(offerId ? { offer_id: offerId } : {}) } }),
  );
}

export function clearRecent(): Promise<Result<unknown>> {
  return call(() => api.DELETE("/v1/me/recent"));
}
