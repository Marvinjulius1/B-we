import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Headset, MapPin, PackageCheck, Ruler, Store, Truck, Warehouse } from "lucide-react";
import { getBrands, getCategoryTree, getFlaggedProducts } from "@/server/catalog";
import { openingHoursText, site, trustPoints } from "@/config/site";
import { promotions } from "@/config/promotions";
import { CategoryTile } from "@/components/catalog/category-tile";
import { ProductRail } from "@/components/shop/product-rail";
import { SearchTrigger } from "@/components/search/search-trigger";
import { AudienceSwitch } from "@/components/home/audience-switch";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRUST_ICONS = [Headset, Truck, PackageCheck, Store];

/**
 * Startseite. Phase 1: statischer Hero mit dezenter Einblendung.
 * Phase 4 ergänzt die scrollgesteuerte 3D-Kamerafahrt als progressive Erweiterung über diesem Inhalt.
 */
export default async function HomePage() {
  const [tree, top, fresh, best, brands] = await Promise.all([
    getCategoryTree(),
    getFlaggedProducts("isTopProduct", 10),
    getFlaggedProducts("isNew", 10),
    getFlaggedProducts("isBestseller", 10),
    getBrands(),
  ]);
  const promo = promotions.find((p) => p.active);
  const brandNames = brands.filter((b) => b.featured).map((b) => b.name);

  return (
    <>
      {/* Hero */}
      <section className="border-line relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_-10%,var(--brand-soft),transparent_70%)]"
        />
        <div className="container-page relative grid gap-10 pt-10 pb-14 md:pt-16 md:pb-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
          <div className="animate-fade-up">
            <p className="border-line bg-surface inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
              <span aria-hidden className="bg-brand size-2 rounded-full" /> Seit 1924 in Aurich · 3. Generation
            </p>
            <h1 className="text-display-xl mt-6">
              Alles fürs Handwerk.
              <br />
              <span className="text-brand-text">Und für Ihr Zuhause.</span>
            </h1>
            <p className="text-muted mt-6 max-w-xl text-lg md:text-xl">
              Fach- und Großhandel aus Ostfriesland: Gitterroste, Eisenwaren, Garten- und Forsttechnik, Arbeitsschutz, Zäune und
              Baubedarf – online bestellt oder im Laden abgeholt.
            </p>
            <div className="mt-8 max-w-xl">
              <SearchTrigger className="min-h-14 text-base" />
            </div>
          </div>
          <div className="animate-fade-up [animation-delay:120ms]">
            <AudienceSwitch />
          </div>
        </div>
      </section>

      {/* Vorteils-Leiste */}
      <section aria-label="Ihre Vorteile" className="border-line bg-surface border-b">
        <ul className="container-page grid grid-cols-2 gap-x-6 gap-y-6 py-8 lg:grid-cols-4">
          {trustPoints.map((t, i) => {
            const Icon = TRUST_ICONS[i];
            return (
              <li key={t.title} className="flex gap-3">
                <Icon aria-hidden className="text-brand-text mt-0.5 size-6 shrink-0" />
                <div>
                  <p className="font-bold">{t.title}</p>
                  <p className="text-muted text-sm">{t.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="container-page space-y-24 pt-16 md:pt-24">
        {/* Kategorien als Bento-Grid */}
        <section aria-labelledby="kategorien">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="kategorien" className="text-display-lg">
              Sortiment
            </h2>
            <Link href="/shop" className="text-brand-text inline-flex items-center gap-1.5 font-semibold hover:underline">
              Alle Kategorien <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <ul className="mt-8 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tree.slice(0, 9).map((c, i) => (
              <li key={c.id} className={cn(i === 0 && "sm:col-span-2 sm:row-span-2")}>
                <CategoryTile category={c} size={i === 0 ? "lg" : "md"} className="h-full" />
              </li>
            ))}
          </ul>
        </section>

        {/* Aktion */}
        {promo && (
          <section
            aria-labelledby="aktion"
            className="bg-ink text-bg relative grid overflow-hidden rounded-[var(--radius-tile)] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
          >
            <div className="relative z-10 p-8 md:p-14">
              <p className="text-brand text-sm font-semibold tracking-wider uppercase">{promo.eyebrow}</p>
              <h2 id="aktion" className="text-display-lg mt-3">
                {promo.title}
              </h2>
              <p className="mt-4 max-w-md text-lg opacity-80">{promo.text}</p>
              <Link href={promo.cta.href} className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
                {promo.cta.label} <ArrowRight aria-hidden />
              </Link>
            </div>
            <div className="relative min-h-64">
              <Image
                src={`/images/placeholder/${promo.motif}-2.svg`}
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="(min-width: 768px) 45vw, 100vw"
              />
            </div>
          </section>
        )}

        <ProductRail id="top-produkte" title="Top-Produkte" products={top} />

        {/* Gitterroste nach Maß */}
        <section
          aria-labelledby="nach-mass"
          className="border-line bg-surface grid gap-8 rounded-[var(--radius-tile)] border p-8 md:grid-cols-2 md:p-14"
        >
          <div>
            <p className="text-brand-text text-sm font-semibold tracking-wider uppercase">Unsere Spezialität</p>
            <h2 id="nach-mass" className="text-display-lg mt-3">
              Gitterroste nach Maß
            </h2>
            <p className="text-muted mt-4 max-w-md text-lg">
              Maschenweite, Maße, Material und Oberfläche wählen – wir prüfen Ihre Anfrage und melden uns mit einem Angebot.
            </p>
            <Link href="/gitterroste-nach-mass" className={cn(buttonVariants({ variant: "dark", size: "lg" }), "mt-8")}>
              <Ruler aria-hidden /> Jetzt konfigurieren
            </Link>
          </div>
          <div className="bg-surface-2 relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src="/images/placeholder/grating-1.svg"
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="(min-width: 768px) 45vw, 100vw"
            />
          </div>
        </section>

        <ProductRail id="neu" title="Neu im Sortiment" products={fresh} />
        <ProductRail id="bestseller" title="Bestseller" products={best} />
      </div>

      {/* Markenleiste (Text-Chips, Logos erst nach Rechteklärung) */}
      <section aria-labelledby="marken" className="border-line bg-surface mt-24 overflow-hidden border-y py-10">
        <h2 id="marken" className="sr-only">
          Unsere Marken
        </h2>
        <div className="marquee group flex w-max gap-3" aria-hidden>
          {[...brandNames, ...brandNames].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="border-line font-display text-muted rounded-full border px-6 py-3 text-2xl font-extrabold"
            >
              {name}
            </span>
          ))}
        </div>
        <ul className="sr-only">
          {brandNames.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <div className="container-page mt-6 text-center">
          <Link href="/marken" className="text-brand-text font-semibold hover:underline">
            Alle Marken ansehen
          </Link>
        </div>
      </section>

      {/* Ladengeschäft */}
      <section aria-labelledby="laden" className="container-page mt-24">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-brand text-brand-ink rounded-[var(--radius-tile)] p-8 md:p-12 lg:col-span-2">
            <h2 id="laden" className="text-display-lg">
              Besuchen Sie uns in Aurich.
            </h2>
            <p className="mt-4 max-w-xl text-lg">
              {site.facts.salesArea} Verkaufsfläche, {site.facts.warehouse} Lager und rund{" "}
              {site.facts.employees.replace("ca. ", "")} Kolleginnen und Kollegen, die wissen, wovon sie reden.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ladengeschaeft" className={buttonVariants({ variant: "dark", size: "lg" })}>
                Anfahrt &amp; Öffnungszeiten
              </Link>
              <a
                href={site.contact.phoneHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-brand-ink/30 text-brand-ink bg-transparent",
                )}
              >
                {site.contact.phoneDisplay}
              </a>
            </div>
          </div>
          <ul className="grid gap-3">
            <li className="border-line bg-surface flex items-start gap-3 rounded-[var(--radius-card)] border p-5">
              <MapPin aria-hidden className="text-brand-text size-5 shrink-0" />
              <span>
                {site.address.street}
                <br />
                {site.address.postalCode} {site.address.city}
              </span>
            </li>
            <li className="border-line bg-surface flex items-start gap-3 rounded-[var(--radius-card)] border p-5">
              <Clock aria-hidden className="text-brand-text size-5 shrink-0" />
              <span>{openingHoursText()}</span>
            </li>
            <li className="border-line bg-surface flex items-start gap-3 rounded-[var(--radius-card)] border p-5">
              <Warehouse aria-hidden className="text-brand-text size-5 shrink-0" />
              <span>Ware ab Lager – große Mengen per Spedition</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
