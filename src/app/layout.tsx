import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthMenu } from "@/features/auth/AuthMenu";
import { AuthProvider } from "@/features/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Nirog: cheaper exact substitutes for your medicines", template: "%s · Nirog" },
  description:
    "Find Jan Aushadhi and branded medicines with the same salts, strength and form as yours, and see how much you can save.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <AuthProvider>
          <header className="site-header">
            <div className="container header-row">
              <Link href="/" className="brand" aria-label="Nirog home">
                <span className="brand-mark" aria-hidden="true">+</span> Nirog
              </Link>
              <nav aria-label="Account">
                <AuthMenu />
              </nav>
            </div>
          </header>
          <main className="container main">{children}</main>
          <footer className="site-footer">
            <div className="container footer-row small muted">
              <span>Price comparison only, not medical advice.</span>
              <Link href="/privacy">Privacy</Link>
              <a href="https://github.com/iaintsaket/nirog-web" rel="noopener noreferrer">
                Source
              </a>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
