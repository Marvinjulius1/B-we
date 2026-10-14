import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryTree, getFlaggedProducts } from "@/server/catalog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CategoryTile } from "@/components/catalog/category-tile";
import { ProductRail } from "@/components/shop/product-rail";

export const metadata: Metadata = {
  title: "Onlineshop – alle Kategorien",
  description:
    "Das Sortiment der Böwe GmbH aus Aurich: Gitterroste, Eisenwaren, Garten und Forst, Elektro, Arbeitsschutz, Sicherheitstechnik, Tore und Türen, Zäune, Baubedarf und mehr.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [tree, top] = await Promise.all([getCategoryTree(), getFlaggedProducts("isTopProduct", 12)]);
  return (
    <div className="container-page pt-6">
      <Breadcrumbs items={[{ name: "Shop", href: "/shop" }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="text-display-lg">Unser Sortiment</h1>
        <p className="text-muted mt-4 text-lg">
          Von der Schraube bis zum Rollgerüst – für Handwerk, Industrie und Haus &amp; Garten. Was Sie nicht finden, besorgen wir:
          einfach anrufen.
        </p>
      </header>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tree.map((c, i) => (
          <li key={c.id} className={i === 0 ? "sm:col-span-2 sm:row-span-2" : undefined}>
            <CategoryTile category={c} size={i === 0 ? "lg" : "md"} className="h-full" />
          </li>
        ))}
      </ul>

      <section className="mt-16" aria-labelledby="alle-kategorien">
        <h2 id="alle-kategorien" className="text-2xl font-extrabold">
          Alle Kategorien im Überblick
        </h2>
        <div className="mt-6 columns-1 gap-8 sm:columns-2 lg:columns-4">
          {tree.map((c) => (
            <div key={c.id} className="mb-8 break-inside-avoid">
              <Link href={c.href} className="hover:text-brand-text font-bold">
                {c.name}
              </Link>
              {c.children.length > 0 && (
                <ul className="text-muted mt-2 space-y-1 text-[0.95rem]">
                  {c.children.map((s) => (
                    <li key={s.id}>
                      <Link href={s.href} className="hover:text-ink">
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <ProductRail id="top-produkte" title="Top-Produkte" products={top} />
      </div>
    </div>
  );
}
