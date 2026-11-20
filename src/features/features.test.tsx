import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { comparison, mockApi, nav, offer, user } from "@/test/helpers";
import { AuthMenu } from "./auth/AuthMenu";
import { AuthProvider } from "./auth/AuthProvider";
import { SignInPage } from "./auth/SignInPage";
import { ComparePage } from "./compare/ComparePage";
import { SavedPage } from "./saved/SavedPage";
import { HomeLink } from "./search/HomeLink";
import { SearchPage } from "./search/SearchPage";

const withAuth = (ui: ReactNode) => render(<AuthProvider>{ui}</AuthProvider>);
const signedOut = { "GET /v1/me": () => Response.json({ error: "unauthorized", message: "x" }, { status: 401 }) };

afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  nav.params = new URLSearchParams();
  nav.push.mockReset();
  nav.replace.mockReset();
});

const compareCalls = (calls: Request[]) =>
  calls.filter((c) => c.url.includes("/v1/compare")).map((c) => new URL(c.url).searchParams.toString());

test("search: splits after two letters; arrow keys pick a medicine and its prices load beside the list", async () => {
  const calls = mockApi({
    ...signedOut,
    "GET /v1/search": {
      did_you_mean: [],
      groups: [
        { key: "k1", salts_label: "Atorvastatin 10mg", matched: [offer({ id: "a", name: "Atorva Tablet" }), offer({ id: "b" })] },
        { key: "k2", salts_label: "Atorvastatin 20mg", matched: [offer({ id: "c", name: "Atorva 20 Tablet" })] },
      ],
    },
    "GET /v1/compare": comparison(),
  });
  withAuth(<SearchPage />);
  const box = screen.getByRole("combobox", { name: /medicine/i });

  await userEvent.type(box, "a");
  expect(box).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

  await userEvent.type(box, "t");
  const options = await within(await screen.findByRole("listbox")).findAllByRole("option");
  expect(options.map((o) => o.textContent)).toEqual([
    expect.stringContaining("Atorva Tablet"),
    expect.stringContaining("Atorva 20 Tablet"),
  ]);
  expect(options[0]).toHaveAttribute("aria-selected", "true");
  expect(box).toHaveAttribute("aria-activedescendant", options[0].id);
  expect(nav.replace).toHaveBeenLastCalledWith("/?q=at", { scroll: false });
  const prices = screen.getByRole("region", { name: "Prices" });
  expect(await within(prices).findByRole("status")).toHaveTextContent("Save up to ₹190.92 per pack");
  await waitFor(() => expect(compareCalls(calls)).toEqual(["key=k1&searched=a"]));

  await userEvent.keyboard("{ArrowDown}");
  expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
  await waitFor(() => expect(compareCalls(calls)).toContain("key=k2&searched=c"));

  await userEvent.keyboard("{Escape}");
  expect(box).toHaveValue("");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("search: picking a medicine hides the other matches until asked", async () => {
  mockApi({
    ...signedOut,
    "GET /v1/search": {
      did_you_mean: [],
      groups: [
        { key: "k1", salts_label: "Paracetamol 500mg", matched: [offer({ id: "a", name: "Dolo 500 Tablet" })] },
        { key: "k2", salts_label: "Paracetamol 650mg", matched: [offer({ id: "b", name: "Dolo 650 Tablet", salts_label: "Paracetamol 650mg" })] },
      ],
    },
    "GET /v1/compare": comparison(),
  });
  nav.params = new URLSearchParams("q=dolo");
  withAuth(<SearchPage />);
  const names = async () =>
    (await within(await screen.findByRole("listbox")).findAllByRole("option")).map((o) => o.querySelector("strong")?.textContent);
  expect(await names()).toEqual(["Dolo 500 Tablet", "Dolo 650 Tablet"]);

  const prices = screen.getByRole("region", { name: "Prices" });
  expect(await within(prices).findByRole("region", { name: "Lipitor 10 Tablet" })).toBeInTheDocument();

  await userEvent.click(screen.getByText("Dolo 650 Tablet"));
  // Picked: the other matches fold away and the details card takes the medicine's place on the left;
  // the prices panel shows only the alternatives.
  const details = await screen.findByRole("region", { name: "Dolo 650 Tablet" });
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(prices).not.toContainElement(details);
  expect(within(details).getByText("Paracetamol 650mg")).toBeInTheDocument();
  await waitFor(() => expect(within(prices).queryByRole("region", { name: "Lipitor 10 Tablet" })).not.toBeInTheDocument());

  await userEvent.click(screen.getByRole("button", { name: "Show all 2 medicines" }));
  expect(await names()).toEqual(["Dolo 500 Tablet", "Dolo 650 Tablet"]);
  expect(within(screen.getByRole("listbox")).getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
});

test("search: the divider resizes the panels and can fold the search away, with a button to bring it back", async () => {
  mockApi({
    ...signedOut,
    "GET /v1/search": { did_you_mean: [], groups: [{ key: "k1", salts_label: "Paracetamol 650mg", matched: [offer({ name: "Dolo 650 Tablet" })] }] },
    "GET /v1/compare": comparison(),
  });
  nav.params = new URLSearchParams("q=dolo");
  withAuth(<SearchPage />);
  await screen.findByRole("listbox");
  const divider = screen.getByRole("separator", { name: "Resize search and prices" });
  expect(divider).toHaveAttribute("aria-valuenow", "380");

  divider.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(divider).toHaveAttribute("aria-valuenow", "404");
  await userEvent.keyboard("{Home}");
  const back = screen.getByRole("button", { name: "Show search" });
  expect(document.querySelector(".search-shell")).toHaveClass("left-collapsed");

  await userEvent.click(back);
  expect(document.querySelector(".search-shell")).not.toHaveClass("left-collapsed");
  expect(screen.getByRole("separator", { name: "Resize search and prices" })).toHaveAttribute("aria-valuenow", "404");
});

test("search: starts from the URL query and shows empty and error states", async () => {
  mockApi({ ...signedOut, "GET /v1/search": { groups: [], did_you_mean: ["Dolo 650 Tablet"] } });
  nav.params = new URLSearchParams("q=dollo");
  const { unmount } = withAuth(<SearchPage />);
  const box = screen.getByRole("combobox", { name: /medicine/i });
  expect(box).toHaveValue("dollo");
  expect(await screen.findByText(/We don't have “dollo” yet/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Dolo 650 Tablet" }));
  expect(box).toHaveValue("Dolo 650 Tablet");
  unmount();

  mockApi({ ...signedOut, "GET /v1/search": () => Response.json({ error: "x", message: "Too many requests" }, { status: 429 }) });
  withAuth(<SearchPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");
});

test("search: the empty screen shows live figures about our prices, and nothing if they fail to load", async () => {
  mockApi({
    ...signedOut,
    "GET /v1/stats": {
      medicines: 349595,
      jan_aushadhi: 1600,
      with_cheaper_substitute: 330613,
      median_saving_bps: 8325,
      prices_updated_on: "2026-11-20",
    },
  });
  const { unmount } = withAuth(<SearchPage />);
  const stats = await screen.findByRole("region", { name: "Our prices in numbers" });
  const facts = Object.fromEntries(
    within(stats).getAllByRole("term").map((dt) => [dt.textContent, dt.nextElementSibling?.textContent]),
  );
  expect(facts).toEqual({
    "Medicines we know": "3,49,595",
    "Jan Aushadhi medicines": "1,600",
    "Have a cheaper exact substitute": "3,30,613",
    "Typical saving": "83%",
  });
  expect(stats).toHaveTextContent("Prices updated 20 Nov 2026");
  unmount();

  mockApi({ ...signedOut, "GET /v1/stats": () => Response.json({ error: "x", message: "down" }, { status: 503 }) });
  withAuth(<SearchPage />);
  await waitFor(() => expect(screen.queryByRole("region", { name: "Our prices in numbers" })).not.toBeInTheDocument());
  expect(screen.getByRole("combobox", { name: /medicine/i })).toBeInTheDocument();
});

test("search: figures count up from zero on load, and from just below on hover", async () => {
  let now = 0;
  let frames: FrameRequestCallback[] = [];
  const flush = (ms: number) => {
    now += ms;
    const run = frames;
    frames = [];
    act(() => run.forEach((f) => f(now)));
  };
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("performance", { now: () => now });
  vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => frames.push(f));
  vi.stubGlobal("cancelAnimationFrame", () => {});
  mockApi({
    ...signedOut,
    "GET /v1/stats": { medicines: 1000, jan_aushadhi: 10, with_cheaper_substitute: 900, median_saving_bps: 8000, prices_updated_on: null },
  });
  withAuth(<SearchPage />);
  const card = (await screen.findByText("Medicines we know")).parentElement!;
  const value = () => Number(card.querySelector("dd")?.textContent?.replace(/,/g, ""));
  expect(value()).toBe(0);
  flush(3000);
  expect(value()).toBe(1000);

  await userEvent.hover(card);
  flush(0);
  expect(value()).toBe(970);
  flush(200);
  expect(value()).toBeGreaterThan(970);
  flush(300);
  expect(value()).toBe(1000);
});

test("search: the home link brings back the empty search screen", async () => {
  mockApi({ ...signedOut, "GET /v1/search": { groups: [], did_you_mean: [] } });
  nav.params = new URLSearchParams("q=dolo");
  withAuth(
    <>
      <HomeLink />
      <SearchPage />
    </>,
  );
  const box = screen.getByRole("combobox", { name: /medicine/i });
  expect(box).toHaveValue("dolo");
  await userEvent.click(screen.getByRole("link", { name: "Nirog home" }));
  expect(box).toHaveValue("");
  expect(screen.getByRole("heading", { name: "Pay less for the same medicine" })).toBeInTheDocument();
});

test("search: a brand we have no price for leads to medicines with its salt; the exact strength is marked", async () => {
  const sameSalt = (key: string) => ({
    ...signedOut,
    "GET /v1/search": {
      did_you_mean: [],
      same_salt_as: { brand: "Disprin", salts_label: "Aspirin 350mg", key },
      groups: [
        { key: "k75", salts_label: "Aspirin 75mg", matched: [offer({ id: "a", name: "Ecosprin 75" })] },
        { key: "k350", salts_label: "Aspirin 350mg", matched: [offer({ id: "b", name: "Aspirin 350 Tablet" })] },
      ],
    },
    "GET /v1/compare": comparison(),
  });
  mockApi(sameSalt("k350"));
  nav.params = new URLSearchParams("q=displin");
  const { unmount } = withAuth(<SearchPage />);
  expect(await screen.findByText(/We don't have Disprin's price/)).toHaveTextContent(
    "We don't have Disprin's price. These medicines have the same salt (Aspirin 350mg).",
  );
  const options = within(screen.getByRole("listbox")).getAllByRole("option");
  expect(within(options[1]).getByText("Same strength")).toBeInTheDocument();
  expect(within(options[0]).queryByText("Same strength")).not.toBeInTheDocument();
  expect(screen.queryByText(/different strength/)).not.toBeInTheDocument();
  unmount();

  mockApi(sameSalt("k-none"));
  withAuth(<SearchPage />);
  expect(await screen.findByText(/different strength/)).toHaveTextContent(
    "None of these is Aspirin 350mg; they have a different strength. Ask your pharmacist before switching.",
  );
});

test("compare: shows the saving and badges (shop links only in the comparison); signed-in users can save", async () => {
  const key = "tablet|standard|atorvastatin:10mg|unit";
  const calls = mockApi({ "GET /v1/me": user, "GET /v1/compare": comparison({ key }), "POST /v1/saved": { id: "s1" } });
  nav.params = new URLSearchParams(`key=${encodeURIComponent(key)}&searched=b1`);
  withAuth(<ComparePage />);

  expect(await screen.findByRole("status")).toHaveTextContent(
    "Save up to ₹190.92 per pack (95%) compared with Lipitor 10 Tablet by choosing Atorvastatin Tablets IP 10mg",
  );
  const card = screen.getByRole("region", { name: "Lipitor 10 Tablet" });
  const facts = Object.fromEntries(
    within(card).getAllByRole("term").map((dt) => [dt.textContent, dt.nextElementSibling?.textContent]),
  );
  expect(facts).toEqual({
    Composition: "Atorvastatin 10mg",
    Form: "Tablet",
    Pack: "10 tablets/capsules",
    Price: "₹200.00 per pack",
    "Per unit": "₹20.00 per tablet/capsule",
    Maker: "Pfizer",
  });
  const list = screen.getByRole("list", { name: "Substitutes, cheapest first" });
  expect(within(list).getByText("Cheapest")).toBeInTheDocument();
  const rungs = within(list).getAllByRole("listitem");
  expect(within(rungs[0]).getByText("Save ₹190.92 per pack")).toBeInTheDocument();
  expect(within(rungs[1]).queryByText(/^Save/)).not.toBeInTheDocument();
  expect(within(list).getByText("You searched")).toBeInTheDocument();
  // Shop links live in the comparison window, not on the cards.
  expect(within(list).queryByRole("link")).not.toBeInTheDocument();

  await userEvent.click(await screen.findByRole("button", { name: "Save" }));
  expect(await screen.findByText(/Saved\./)).toBeInTheDocument();
  const post = calls.find((c) => c.method === "POST")!;
  expect(await post.json()).toEqual({ key, label: "Lipitor 10 Tablet", offer_id: "b1" });
});

test("compare: the Cheapest, Jan Aushadhi and You searched boxes filter the list; pressing again shows all", async () => {
  const ja2 = offer({ id: "j2", source: "jan_aushadhi", name: "Atorvastatin JA Strip", unit_price_millipaise: 150000 });
  const c = comparison();
  mockApi({ ...signedOut, "GET /v1/compare": { ...c, offers: [c.offers[0], { offer: ja2, links: [] }, c.offers[1]], total_offers: 3, searched_index: 2 } });
  nav.params = new URLSearchParams("key=k1&searched=b1");
  withAuth(<ComparePage />);
  const names = () =>
    within(screen.getByRole("list", { name: "Substitutes, cheapest first" }))
      .getAllByRole("listitem")
      .map((li) => li.querySelector("strong")?.textContent);
  const all = ["Atorvastatin Tablets IP 10mg", "Atorvastatin JA Strip", "Lipitor 10 Tablet"];
  await screen.findByRole("status");
  expect(names()).toEqual(all);

  const boxes = screen.getByRole("group", { name: "Quick filters" });
  const cheapest = within(boxes).getByRole("button", { name: /^Cheapest/ });
  await userEvent.click(cheapest);
  expect(cheapest).toHaveAttribute("aria-pressed", "true");
  expect(names()).toEqual(["Atorvastatin Tablets IP 10mg"]);

  await userEvent.click(within(boxes).getByRole("button", { name: /^Jan Aushadhi/ }));
  expect(cheapest).toHaveAttribute("aria-pressed", "false");
  expect(names()).toEqual(["Atorvastatin Tablets IP 10mg", "Atorvastatin JA Strip"]);

  await userEvent.click(within(boxes).getByRole("button", { name: /^You searched/ }));
  expect(names()).toEqual(["Lipitor 10 Tablet"]);
  await userEvent.click(screen.getByRole("button", { name: "Show all 3" }));
  expect(names()).toEqual(all);

  const chips = screen.getByRole("group", { name: "Show" });
  await userEvent.click(within(chips).getByRole("button", { name: "Brands" }));
  expect(names()).toEqual(["Lipitor 10 Tablet"]);
  await userEvent.click(within(chips).getByRole("button", { name: "Jan Aushadhi" }));
  expect(names()).toEqual(["Atorvastatin Tablets IP 10mg", "Atorvastatin JA Strip"]);
  await userEvent.click(within(chips).getByRole("button", { name: "All" }));
  expect(within(chips).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  expect(names()).toEqual(all);

  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "Price: high to low");
  expect(names()).toEqual([...all].reverse());
});

test("compare: clicking an alternative opens a side-by-side comparison with your medicine", async () => {
  const key = "tablet|standard|atorvastatin:10mg|unit";
  mockApi({ ...signedOut, "GET /v1/compare": comparison({ key }) });
  nav.params = new URLSearchParams(`key=${encodeURIComponent(key)}&searched=b1`);
  withAuth(<ComparePage />);
  await screen.findByRole("status");

  await userEvent.click(screen.getByRole("button", { name: "Compare Atorvastatin Tablets IP 10mg with Lipitor 10 Tablet" }));
  const dialog = screen.getByRole("dialog", { name: "Lipitor 10 Tablet vs Atorvastatin Tablets IP 10mg" });
  const rows = Object.fromEntries(
    within(dialog)
      .getAllByRole("row")
      .slice(1)
      .map((tr) => [tr.querySelector("th")?.textContent, [...tr.querySelectorAll("td")].map((td) => td.textContent)]),
  );
  expect(rows).toEqual({
    "Made by": ["Pfizer", "Pfizer"],
    Type: ["Brand", "Jan Aushadhi"],
    Composition: ["Atorvastatin 10mg", "Atorvastatin 10mg ✓ Same"],
    Form: ["Tablet", "Tablet ✓ Same"],
    Pack: ["10 tablets/capsules", "10 tablets/capsules"],
    "Price per pack": ["₹200.00", "₹9.08"],
    "Per unit": ["₹20.00 per tablet/capsule", "₹0.91 per tablet/capsule"],
  });
  expect(within(dialog).getByText(/You save/)).toHaveTextContent("You save ₹190.92 per pack (95%) with Atorvastatin Tablets IP 10mg.");
  expect(within(dialog).getByRole("link", { name: /Jan Aushadhi Kendra/ })).toHaveAttribute("rel", "noopener noreferrer");

  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  // Anywhere on the card opens it too, but its buttons keep their own jobs.
  const list = screen.getByRole("list", { name: "Substitutes, cheapest first" });
  await userEvent.click(within(list).getByText("₹0.91 each"));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");

  // Add to compare: a tray collects up to 3 alternatives and opens the same comparison.
  const add = screen.getByRole("button", { name: "Add Atorvastatin Tablets IP 10mg to compare" });
  await userEvent.click(add);
  expect(add).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  const tray = screen.getByRole("region", { name: "Compare tray" });
  expect(tray).toHaveTextContent("1 of 3 added");
  await userEvent.click(within(tray).getByRole("button", { name: "Compare 2 medicines" }));
  expect(screen.getByRole("dialog", { name: "Lipitor 10 Tablet vs Atorvastatin Tablets IP 10mg" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Close comparison" }));
  await userEvent.click(within(tray).getByRole("button", { name: "Clear" }));
  expect(screen.queryByRole("region", { name: "Compare tray" })).not.toBeInTheDocument();
});

test("compare: with no cheaper exact substitute, close matches show what differs and link to their prices", async () => {
  const only = comparison().offers[1];
  mockApi({
    ...signedOut,
    "GET /v1/compare": comparison({ offers: [only], total_offers: 1, searched_index: 0, saving_per_pack_paise: 0, saving_bps: 0 }),
    "GET /v1/close": {
      matches: [
        {
          key: "topical|standard|x:1%|g",
          salts_label: "Diclofenac 1.16% + Menthol 5%",
          offers: 13,
          cheapest: offer({ id: "e", name: "Ellynac Hot Gel", unit_price_millipaise: 150000, pack_unit: "g" }),
          differences: ["Capsaicin 0.025% instead of 0.01%"],
        },
      ],
    },
  });
  nav.params = new URLSearchParams("key=k1&searched=b1");
  withAuth(<ComparePage />);
  const close = await screen.findByRole("region", { name: "Close matches" });
  expect(close).toHaveTextContent("Not exact substitutes");
  expect(within(close).getByText("Capsaicin 0.025% instead of 0.01%")).toBeInTheDocument();
  expect(within(close).getByText("Ellynac Hot Gel")).toBeInTheDocument();
  expect(within(close).getByRole("link", { name: /See 13 prices/ })).toHaveAttribute(
    "href",
    `/compare?key=${encodeURIComponent("topical|standard|x:1%|g")}`,
  );
  // Same card as everywhere: clicking it compares with yours, and it can join the compare tray.
  await userEvent.click(within(close).getByText("from ₹1.50/g"));
  expect(screen.getByRole("dialog", { name: "Lipitor 10 Tablet vs Ellynac Hot Gel" })).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await userEvent.click(within(close).getByRole("button", { name: "Add Ellynac Hot Gel to compare" }));
  expect(screen.getByRole("region", { name: "Compare tray" })).toHaveTextContent("1 of 3 added");
});

test("compare: already cheapest, save failure, and not found", async () => {
  mockApi({
    "GET /v1/me": user,
    "GET /v1/compare": comparison({ saving_per_pack_paise: 0, saving_bps: 0, searched_index: 0 }),
    "POST /v1/saved": () => Response.json({ error: "conflict", message: "Already saved" }, { status: 409 }),
  });
  nav.params = new URLSearchParams("key=k1&searched=j1");
  const { unmount } = withAuth(<ComparePage />);
  expect(await screen.findByText(/already the cheapest/)).toBeInTheDocument();
  await userEvent.click(await screen.findByRole("button", { name: "Save" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Already saved");
  unmount();

  mockApi({ ...signedOut, "GET /v1/compare": () => Response.json({ error: "not_found", message: "Not found" }, { status: 404 }) });
  withAuth(<ComparePage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Not found");
  expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
});

test("saved: signed-out users are sent to sign in", async () => {
  mockApi(signedOut);
  withAuth(<><AuthMenu /><SavedPage /></>);
  const links = await screen.findAllByRole("link", { name: "Sign in" });
  expect(links.map((l) => l.getAttribute("href"))).toEqual(["/signin", "/signin"]);
});

test("saved: lists, removes, signs out and deletes the account", async () => {
  const calls = mockApi({
    "GET /v1/me": user,
    "GET /v1/saved": [{ id: "s1", key: "k1", label: "Dad's statin", offer_id: "b1", created_at: "2026-11-20T00:00:00Z" }],
    "DELETE /v1/saved/s1": 204,
    "DELETE /v1/me": 204,
    "POST /v1/auth/logout": 204,
  });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  withAuth(<><AuthMenu /><SavedPage /></>);

  expect(await screen.findByRole("link", { name: "Dad's statin" })).toHaveAttribute("href", "/compare?key=k1&searched=b1");
  await userEvent.click(screen.getByRole("button", { name: "Remove" }));
  expect(await screen.findByText(/Nothing saved yet/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Delete my account" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/"));
  expect(calls.some((c) => c.method === "DELETE" && c.url.endsWith("/v1/me"))).toBe(true);
});

test("saved: account deletion errors are shown; sign out clears the user", async () => {
  mockApi({
    "GET /v1/me": user,
    "GET /v1/saved": [],
    "DELETE /v1/me": () => Response.json({ error: "x", message: "Try later" }, { status: 503 }),
    "POST /v1/auth/logout": 204,
  });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  withAuth(<><AuthMenu /><SavedPage /></>);
  await userEvent.click(await screen.findByRole("button", { name: "Delete my account" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Try later");

  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findAllByRole("link", { name: "Sign in" })).toHaveLength(2);
});

test("sign-in: shows the Google button, a failure notice, or the signed-in user", async () => {
  mockApi(signedOut);
  nav.params = new URLSearchParams("error=login_failed");
  const { unmount } = withAuth(<SignInPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("did not complete");
  expect(screen.getByRole("link", { name: "Continue with Google" })).toHaveAttribute("href", "/v1/auth/google/start");
  unmount();

  mockApi({ "GET /v1/me": user });
  nav.params = new URLSearchParams();
  withAuth(<SignInPage />);
  expect(await screen.findByText(user.email)).toBeInTheDocument();
});
