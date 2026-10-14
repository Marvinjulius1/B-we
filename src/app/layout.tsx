import type { Metadata, Viewport } from "next";
import "./globals.css";
import { archivo, inter } from "./fonts";
import { site } from "@/config/site";
import { ThemeScript } from "@/components/layout/theme-script";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBar } from "@/components/layout/mobile-bar";
import { CommandPalette } from "@/components/search/command-palette";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { StoreHydrator } from "@/components/shop/store-hydrator";
import { JsonLd, organizationSchema } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Böwe GmbH Aurich – Fach- und Großhandel seit 1924",
    template: "%s | Böwe Aurich",
  },
  description:
    "Gitterroste, Eisenwaren, Garten- und Forsttechnik, Arbeitsschutz, Sicherheitstechnik, Zäune und Baubedarf – online bestellen oder im Ladengeschäft in Aurich. Seit 1924.",
  applicationName: site.legalName,
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.legalName,
    images: [{ url: "/brand/og-default.png", width: 1200, height: 630, alt: "böwe GmbH – Seit 1924 in Aurich" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const demo = process.env.NEXT_PUBLIC_DEMO_DATA === "true";
  return (
    <html lang="de" className={`${archivo.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#inhalt"
          className="bg-ink text-bg sr-only z-[70] rounded-full px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Zum Inhalt springen
        </a>
        {demo && (
          <p className="bg-ink text-bg py-1.5 text-center text-xs font-medium">
            Entwicklungsumgebung · Beispieldaten – Preise und Bestände sind nicht verbindlich
          </p>
        )}
        <SiteHeader />
        <main id="inhalt" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <MobileBar />
        <CommandPalette />
        <ConsentBanner />
        <StoreHydrator />
        <JsonLd data={organizationSchema()} />
      </body>
    </html>
  );
}
