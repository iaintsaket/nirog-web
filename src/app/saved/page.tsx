import type { Metadata } from "next";
import { SavedPage } from "@/features/saved/SavedPage";

export const metadata: Metadata = { title: "Saved medicines", robots: { index: false, follow: false } };

export default function Saved() {
  return <SavedPage />;
}
