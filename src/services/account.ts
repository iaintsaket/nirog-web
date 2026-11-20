import { api, type User } from "@/api/client";
import { call, type Result } from "./result";

export const SIGN_IN_URL = "/v1/auth/google/start";

/** The signed-in user, or null when signed out. */
export async function currentUser(): Promise<Result<User | null>> {
  const r = await call(() => api.GET("/v1/me"));
  if (!r.ok && r.status === 401) return { ok: true, data: null };
  return r;
}

export function signOut(): Promise<Result<unknown>> {
  return call(() => api.POST("/v1/auth/logout"));
}

export function deleteAccount(): Promise<Result<unknown>> {
  return call(() => api.DELETE("/v1/me"));
}
