import Link from "next/link";
import { Clock, MessageCircle, Phone } from "lucide-react";
import { getCategoryTree } from "@/server/catalog";
import { mainNav, openingHoursText, site } from "@/config/site";
import { Logo } from "./logo";
import { CategoryPanel, CategoryPanelTrigger } from "./category-panel";
import { HeaderActions } from "./header-actions";
import { SearchTrigger } from "@/components/search/search-trigger";

/**
 * Schlanker Header: Logo · Sortiment · Suche (zentral) · Konto/Merkzettel/Warenkorb.
 * Darüber eine dezente Service-Zeile mit Telefon, WhatsApp und Öffnungszeiten.
 */
export async function SiteHeader() {
  const tree = await getCategoryTree();
  return (
    <>
      <div className="border-line bg-surface-2/70 text-muted hidden border-b text-[0.8rem] md:block">
        <div className="container-page flex h-9 items-center justify-between gap-6">
          <p className="text-ink font-medium">{site.shortClaim} · persönliche Beratung</p>
          <ul className="flex items-center gap-5">
            <li>
              <a href={site.contact.phoneHref} className="hover:text-ink inline-flex items-center gap-1.5">
                <Phone aria-hidden className="size-3.5" /> {site.contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={site.contact.whatsappHref}
                className="hover:text-ink inline-flex items-center gap-1.5"
                rel="noopener"
                target="_blank"
              >
                <MessageCircle aria-hidden className="size-3.5" /> WhatsApp
              </a>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="size-3.5" /> {openingHoursText()}
            </li>
            <li>
              <Link href="/geschaeftskunden" className="text-ink font-medium hover:underline">
                Für Geschäftskunden
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <header className="glass border-line sticky top-0 z-40 border-b">
        <div className="container-page flex h-16 items-center gap-3 md:h-[4.5rem] md:gap-5">
          <Logo eager />
          <CategoryPanelTrigger className="hidden md:inline-flex" />
          <div className="mx-auto hidden w-full max-w-xl md:block">
            <SearchTrigger />
          </div>
          <div className="ml-auto md:ml-0">
            <HeaderActions />
          </div>
        </div>
        <nav aria-label="Hauptnavigation" className="border-line/70 hidden border-t lg:block">
          <ul className="container-page flex h-11 items-center gap-6 text-sm font-medium">
            {tree.slice(0, 9).map((c) => (
              <li key={c.id}>
                <Link href={c.href} className="text-muted hover:text-ink transition-colors">
                  {c.name}
                </Link>
              </li>
            ))}
            <li className="ml-auto">
              <Link href={mainNav[1].href} className="text-brand-text hover:underline">
                {mainNav[1].label}
              </Link>
            </li>
          </ul>
        </nav>
        {/* Mobil: Suchfeld immer sichtbar */}
        <div className="container-page pb-3 md:hidden">
          <SearchTrigger />
        </div>
      </header>

      <CategoryPanel tree={tree} />
    </>
  );
}
