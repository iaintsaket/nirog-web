import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { absolute } from "@/lib/site";
import About from "@/app/about/page";
import { AboutLink } from "./AboutLink";

const scrollTo = vi.fn();

beforeEach(() => {
  scrollTo.mockReset();
  Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
  // jsdom has no layout: put the cards 500px apart, 480px wide.
  const index = (el: HTMLElement) => Number(el.closest("[data-card]")?.getAttribute("data-card") ?? 0);
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute("data-card") ? index(this) * 500 : 0;
  });
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(480);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const reduceMotion = (on: boolean) =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} }));

const track = () => screen.getByRole("region", { name: /about nirog/i }).querySelector<HTMLElement>("[data-track]")!;
const cardAt = (n: number) => track().querySelector<HTMLElement>(`[data-card="${n}"]`)!;

test("about: five cards in order, the first is the mission, and nothing promises what is not built", () => {
  reduceMotion(false);
  render(<About />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/about/i);
  const carousel = screen.getByRole("region", { name: "About Nirog" });
  const titles = within(carousel).getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
  expect(titles).toEqual([
    "Health for everyone, everywhere",
    "The same medicine at a fair price",
    "Exact substitutes, honestly compared",
    "Public prices, no ads or trackers",
    "We are just getting started",
  ]);
  expect(cardAt(0).id).toBe("mission");
  expect(document.body.textContent).not.toMatch(/hotline|village|doctor|coming soon/i);
});

test("about: arrows, dots and the keyboard move one card at a time, and the dots follow the scroll", async () => {
  reduceMotion(false);
  render(<About />);
  const prev = screen.getByRole("button", { name: "Previous card" });
  const next = screen.getByRole("button", { name: "Next card" });
  expect(prev).toBeDisabled();
  await userEvent.click(next);
  expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 500 }));
  await userEvent.click(screen.getByRole("button", { name: "Go to card 4" }));
  expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 1500 }));

  fireEvent.scroll(track(), { target: { scrollLeft: 1500 } });
  expect(screen.getByRole("button", { name: "Go to card 4" })).toHaveAttribute("aria-current", "true");
  expect(screen.getByRole("button", { name: "Go to card 1" })).not.toHaveAttribute("aria-current");
  expect(prev).toBeEnabled();

  track().focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 2000 }));
  fireEvent.scroll(track(), { target: { scrollLeft: 2000 } });
  expect(next).toBeDisabled();
  await userEvent.keyboard("{ArrowLeft}");
  expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 1500 }));
});

test("about: scrolling shifts each card's art (parallax); it stays still for people who ask for less motion", () => {
  reduceMotion(false);
  const { unmount } = render(<About />);
  fireEvent.scroll(track(), { target: { scrollLeft: 250 } });
  // Card 0 sits half a card left of centre, card 1 half a card right of it.
  expect(cardAt(0).style.getPropertyValue("--p")).toBe("-0.5");
  expect(cardAt(1).style.getPropertyValue("--p")).toBe("0.5");
  unmount();

  reduceMotion(true);
  render(<About />);
  fireEvent.scroll(track(), { target: { scrollLeft: 250 } });
  expect(cardAt(0).style.getPropertyValue("--p")).toBe("");
});

test("about link: one About link beside the logo goes straight to the cards, with no dropdown", () => {
  render(<AboutLink />);
  expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.queryByRole("menu")).toBeNull();
});

test("the sitemap lists the about page", () => {
  expect(sitemap().map((e) => e.url)).toContain(absolute("/about"));
});

test("about: a mouse can drag the cards and they settle on the nearest one; touch is left to the browser", () => {
  reduceMotion(false);
  render(<About />);
  const t = track();
  fireEvent.pointerDown(t, { pointerType: "touch", button: 0, clientX: 400, pointerId: 1 });
  fireEvent.pointerMove(t, { pointerType: "touch", clientX: 100, pointerId: 1 });
  expect(t.scrollLeft).toBe(0);

  fireEvent.pointerDown(t, { pointerType: "mouse", button: 0, clientX: 400, pointerId: 2 });
  fireEvent.pointerMove(t, { pointerType: "mouse", clientX: 100, pointerId: 2 });
  expect(t.scrollLeft).toBe(300);
  expect(t).toHaveClass("dragging");
  fireEvent.pointerUp(t, { pointerType: "mouse", clientX: 100, pointerId: 2 });
  expect(t).not.toHaveClass("dragging");
  expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 500 }));
});
