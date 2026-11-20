export type Result<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

type ApiResponse<T> = {
  data?: T;
  error?: { message?: string } | unknown;
  response: Response;
};

const FALLBACK = "Something went wrong. Please try again.";

/** Turns an openapi-fetch response into a Result with a user-readable message. */
export function toResult<T>(res: ApiResponse<T>): Result<T> {
  if (res.response.ok) {
    return { ok: true, data: res.data as T };
  }
  const err = res.error as { message?: unknown } | undefined;
  const message = typeof err?.message === "string" && err.message ? err.message : FALLBACK;
  return { ok: false, status: res.response.status, message };
}

/** Network failures (offline, proxy down) become a Result too. */
export async function call<T>(fn: () => Promise<ApiResponse<T>>): Promise<Result<T>> {
  try {
    return toResult(await fn());
  } catch {
    return { ok: false, status: 0, message: "Could not reach Nirog. Check your connection." };
  }
}
