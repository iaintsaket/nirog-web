import { vi } from "vitest";
import type { Comparison, Offer, User } from "@/api/client";

type Handler = (req: Request) => Response | Promise<Response>;

/** Stubs fetch with "METHOD /path" handlers; records requests. Unknown routes → 404. */
export function mockApi(routes: Record<string, Handler | object | number>) {
  const calls: Request[] = [];
  vi.stubGlobal("fetch", async (req: Request) => {
    calls.push(req);
    const url = new URL(req.url);
    const r = routes[`${req.method} ${url.pathname}`];
    if (r === undefined) return Response.json({ error: "not_found", message: "Not found." }, { status: 404 });
    if (typeof r === "function") return (r as Handler)(req);
    if (typeof r === "number") return new Response(null, { status: r });
    return Response.json(r);
  });
  return calls;
}

export const nav = { params: new URLSearchParams(), push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useSearchParams: () => nav.params,
  useRouter: () => nav, // stable, like the real router
}));

export function offer(over: Partial<Offer> = {}): Offer {
  return {
    id: "b1",
    source: "brand",
    name: "Lipitor 10 Tablet",
    manufacturer: "Pfizer",
    price_paise: 20000,
    pack_count: 10,
    pack_unit: "unit",
    unit_price_millipaise: 2000000,
    salts_label: "Atorvastatin 10mg",
    ...over,
  };
}

export const user: User = { id: "u1", email: "asha@example.com", name: "Asha", recent: [] };

export function comparison(over: Partial<Comparison> = {}): Comparison {
  return {
    key: "k1",
    offers: [
      {
        offer: offer({ id: "j1", source: "jan_aushadhi", name: "Atorvastatin Tablets IP 10mg", price_paise: 908, unit_price_millipaise: 90800 }),
        links: [{ kind: "store", label: "Find a Jan Aushadhi Kendra", url: "https://example.org/kendra" }],
        vendors: [],
      },
      { offer: offer(), links: [], vendors: [] },
    ],
    total_offers: 2,
    searched_index: 1,
    saving_per_pack_paise: 19092,
    saving_bps: 9546,
    ...over,
  };
}
