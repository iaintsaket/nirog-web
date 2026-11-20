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
});

test("search: submits the query, then lists matching groups with compare links", async () => {
  mockApi({
    "GET /v1/search": {
      groups: [
        {
          key: "k1",
          salts_label: "Atorvastatin 10mg",
          matched: ["a", "b", "c", "d"].map((id) => offer({ id, name: `Atorva ${id}` })),
        },
      ],
    },
  });
  const { rerender } = render(<SearchPage />);
  await userEvent.type(screen.getByRole("searchbox"), "  atorva ");
  await userEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(nav.push).toHaveBeenCalledWith("/?q=atorva");

  nav.params = new URLSearchParams("q=atorva");
  rerender(<SearchPage />);
  const results = await screen.findByRole("region", { name: "Search results" });
  expect(within(results).getAllByRole("link", { name: /Atorva/ })).toHaveLength(3);
  expect(within(results).getByText(/and 1 more/)).toBeInTheDocument();
  expect(within(results).getByRole("link", { name: "Compare cheaper options" })).toHaveAttribute(
    "href",
    "/compare?key=k1&searched=a",
  );
});

test("search: shows empty and error states", async () => {
  mockApi({ "GET /v1/search": { groups: [] } });
  nav.params = new URLSearchParams("q=zzzz");
  const { unmount } = render(<SearchPage />);
  expect(await screen.findByText(/No medicines match/)).toBeInTheDocument();
  unmount();

  mockApi({ "GET /v1/search": () => Response.json({ error: "x", message: "Too many requests" }, { status: 429 }) });
  render(<SearchPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");
});

test("compare: shows the saving, badges and buy links; signed-in users can save", async () => {
  const calls = mockApi({ "GET /v1/me": user, "GET /v1/compare": comparison(), "POST /v1/saved": { id: "s1" } });
  nav.params = new URLSearchParams("key=k1&searched=b1");
  withAuth(<ComparePage />);

  expect(await screen.findByRole("status")).toHaveTextContent(
    "Save up to ₹190.92 per pack (95%) compared with Lipitor 10 Tablet by choosing Atorvastatin Tablets IP 10mg",
  );
  expect(screen.getByText("Cheapest")).toBeInTheDocument();
  expect(screen.getByText("You searched")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Jan Aushadhi Kendra/ })).toHaveAttribute("rel", "noopener noreferrer");

  await userEvent.click(await screen.findByRole("button", { name: "Save" }));
  expect(await screen.findByText(/Saved\./)).toBeInTheDocument();
  const post = calls.find((c) => c.method === "POST")!;
  expect(await post.json()).toEqual({ key: "k1", label: "Lipitor 10 Tablet", offer_id: "b1" });
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
