import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AboutLink } from "@/features/about/AboutLink";
import { AuthMenu } from "@/features/auth/AuthMenu";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { HomeLink } from "@/features/search/HomeLink";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, TITLE_SUFFIX } from "@/lib/site";
import { Splash } from "@/ui/Splash";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s${TITLE_SUFFIX}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN", title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  formatDetection: { telephone: false },
  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the token Search Console gives for the meta-tag method.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f7a55" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        {/* First load only: the layout is not re-rendered on navigation. */}
        <Splash />
        <AuthProvider>
          <header className="site-header">
            <div className="container header-row">
              <div className="header-left">
                <HomeLink />
                <AboutLink />
              </div>
              <nav aria-label="Account">
                <AuthMenu />
              </nav>
            </div>
          </header>
          <main className="container main">{children}</main>
          <footer className="site-footer">
            <div className="container footer-row small muted">
              <span>Price comparison only, not medical advice.</span>
              <Link href="/medicines/a">All medicines</Link>
              <Link href="/about">About</Link>
              <Link href="/privacy">Privacy</Link>
              <a href="https://github.com/iaintsaket/nirog-web" rel="noopener noreferrer">
                Source
              </a>
              {process.env.NEXT_PUBLIC_VERSION && (
                <a href="https://github.com/iaintsaket/nirog-web/releases" rel="noopener noreferrer" title="Running version">
                  {process.env.NEXT_PUBLIC_VERSION}
                </a>
              )}
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
