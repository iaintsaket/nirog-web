import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { comparison, mockApi, nav, offer, user } from "@/test/helpers";
import { AuthMenu } from "./auth/AuthMenu";
import { AuthProvider } from "./auth/AuthProvider";
import { SignInPage } from "./auth/SignInPage";
import { ComparePage } from "./compare/ComparePage";
import { SavedPage } from "./saved/SavedPage";
import { SearchPage } from "./search/SearchPage";

const withAuth = (ui: ReactNode) => render(<AuthProvider>{ui}</AuthProvider>);
const signedOut = { "GET /v1/me": () => Response.json({ error: "unauthorized", message: "x" }, { status: 401 }) };

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

test("compare: shows the saving, badges and buy links; signed-in users can save", async () => {
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
  expect(within(list).getByText("You searched")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Jan Aushadhi Kendra/ })).toHaveAttribute("rel", "noopener noreferrer");

  await userEvent.click(await screen.findByRole("button", { name: "Save" }));
  expect(await screen.findByText(/Saved\./)).toBeInTheDocument();
  const post = calls.find((c) => c.method === "POST")!;
  expect(await post.json()).toEqual({ key, label: "Lipitor 10 Tablet", offer_id: "b1" });
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
