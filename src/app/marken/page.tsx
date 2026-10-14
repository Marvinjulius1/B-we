import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/server/catalog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Marken",
  description:
    "Markenübersicht bei Böwe in Aurich: Stihl, Viking, Ego, Abus, Burg-Wächter, Hörmann, Makita, FHB, Betafence, Layher und viele mehr.",
  alternates: { canonical: "/marken" },
};

export default async function BrandsPage() {
  const brands = await getBrands();
  const featured = brands.filter((b) => b.featured);
  const byLetter = new Map<string, typeof brands>();
  for (const b of brands) {
    const letter = /[a-z]/i.test(b.name[0]) ? b.name[0].toUpperCase() : "#";
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), b]);
  }
  return (
    <div className="container-page pt-6">
      <Breadcrumbs items={[{ name: "Marken", href: "/marken" }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="text-display-lg">Marken</h1>
        <p className="text-muted mt-4 text-lg">
          Qualität von Herstellern, denen Profis vertrauen. Als Fachhändler beraten wir Sie herstellerübergreifend.
        </p>
      </header>

      {/* Markennamen als Text-Chips – Logos erst nach Klärung der Nutzungsrechte */}
      <ul className="mt-10 flex flex-wrap gap-2">
        {featured.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/marken/${b.slug}`}
              className="border-line bg-surface font-display hover:border-ink inline-flex min-h-12 items-center rounded-full border px-5 text-lg font-bold transition-colors"
            >
              {b.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[...byLetter.entries()]
          .sort(([a], [b]) => a.localeCompare(b, "de"))
          .map(([letter, list]) => (
            <section key={letter} aria-labelledby={`marken-${letter}`}>
              <h2 id={`marken-${letter}`} className="font-display text-brand-text text-3xl font-extrabold">
                {letter}
              </h2>
              <ul className="mt-3 space-y-1.5">
                {list.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/marken/${b.slug}`} className="hover:text-brand-text flex justify-between gap-3">
                      <span>{b.name}</span>
                      <span className="text-muted text-sm tabular-nums">{b.productCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </div>
  );
}
