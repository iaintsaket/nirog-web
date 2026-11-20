import { expect, test, vi } from "vitest";
import { mockApi, user } from "@/test/helpers";
import { currentUser, deleteAccount, signOut } from "./account";
import { compareMatch, searchMedicines } from "./catalog";
import { listSaved, removeSaved, saveMatch } from "./saved";

test("sends the documented requests and unwraps successful responses", async () => {
  const calls = mockApi({
    "GET /v1/search": { groups: [], did_you_mean: ["Dolo 650"] },
    "GET /v1/compare": { key: "k1" },
    "GET /v1/me": user,
    "POST /v1/auth/logout": 204,
    "DELETE /v1/me": 204,
    "GET /v1/saved": [],
    "POST /v1/saved": { id: "s1" },
    "DELETE /v1/saved/s1": 204,
  });
  expect(await searchMedicines("dolo")).toEqual({ ok: true, data: { groups: [], didYouMean: ["Dolo 650"], sameSaltAs: null } });
  expect((await compareMatch("k1", "b1")).ok).toBe(true);
  expect(await currentUser()).toEqual({ ok: true, data: user });
  for (const r of await Promise.all([signOut(), deleteAccount(), listSaved(), saveMatch("k1", "Mine", "b1"), removeSaved("s1")])) {
    expect(r.ok).toBe(true);
  }
  const urls = calls.map((c) => `${c.method} ${new URL(c.url).pathname}${new URL(c.url).search}`);
  expect(urls).toContain("GET /v1/search?q=dolo");
  expect(urls).toContain("GET /v1/compare?key=k1&searched=b1");
  expect(await calls.find((c) => c.method === "POST" && c.url.endsWith("/v1/saved"))!.json()).toEqual({
    key: "k1",
    label: "Mine",
    offer_id: "b1",
  });
});

test("maps failures to readable results", async () => {
  mockApi({
    "GET /v1/me": () => Response.json({ error: "unauthorized", message: "Sign in" }, { status: 401 }),
    "GET /v1/search": () => Response.json({ error: "invalid", message: "query must be 2 to 100 characters" }, { status: 400 }),
    "GET /v1/saved": () => new Response("boom", { status: 500 }),
  });
  expect(await currentUser()).toEqual({ ok: true, data: null }); // signed out is not an error
  expect(await searchMedicines("x")).toEqual({ ok: false, status: 400, message: "query must be 2 to 100 characters" });
  expect(await listSaved()).toMatchObject({ ok: false, status: 500, message: expect.stringMatching(/try again/) });

  vi.stubGlobal("fetch", () => Promise.reject(new TypeError("offline")));
  expect(await compareMatch("k1")).toMatchObject({ ok: false, status: 0 });
});
