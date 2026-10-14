import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { Ruler } from "lucide-react";
import { getCategory, getCategoryTree, type CategoryNode } from "@/server/catalog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductListing, ListingSkeleton } from "@/components/shop/product-listing";
import { cn } from "@/lib/utils";

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

export async function generateStaticParams() {
  const tree = await getCategoryTree();
  return flatten(tree)
    .filter((c) => c.href === `/shop/${c.path}`)
    .map((c) => ({ path: c.path.split("/") }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[...path]">): Promise<Metadata> {
  const { path } = await params;
  const cat = await getCategory(path.join("/"));
  if (!cat) return { title: "Kategorie nicht gefunden" };
  const parent = cat.ancestors.at(-1)?.name;
  return {
    title: cat.metaTitle ?? (parent ? `${cat.name} – ${parent}` : `${cat.name} kaufen`),
    description:
      cat.metaDescription ??
      `${cat.name}${parent ? ` aus dem Bereich ${parent}` : ""} bei Böwe in Aurich: ${cat.description ?? "große Auswahl, persönliche Beratung und schnelle Lieferung."}`,
    alternates: { canonical: `/shop/${cat.path}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/shop/[...path]">) {
  const { path } = await params;
  const cat = await getCategory(path.join("/"));
  if (!cat) notFound();
  // Querverweis-Kategorien (z. B. Tore und Türen › Türschlösser) leiten auf die kanonische Kategorie
  if (cat.href !== `/shop/${cat.path}`) permanentRedirect(cat.href);

  const basePath = `/shop/${cat.path}`;
  const crumbs = [
    { name: "Shop", href: "/shop" },
    ...cat.ancestors.map((a) => ({ name: a.name, href: `/shop/${a.path}` })),
    { name: cat.name, href: basePath },
  ];
  // Unterkategorien zeigen; in Blatt-Kategorien die Geschwister (schneller Wechsel)
  const chips = cat.children.length ? cat.children : cat.depth > 0 ? cat.siblings : [];
  const isGrating = cat.path.startsWith("gitterroste");

  return (
    <div className="container-page pt-6">
      <Breadcrumbs items={crumbs} />

      <header className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="max-w-3xl">
          <h1 className="text-display-lg">{cat.name}</h1>
          {cat.description && <p className="text-muted mt-4 text-lg">{cat.description}</p>}
        </div>
        {isGrating && (
          <Link
            href="/gitterroste-nach-mass"
            className="bg-ink text-bg hover:bg-ink/90 inline-flex items-center gap-3 rounded-2xl px-5 py-4 transition-colors"
          >
            <Ruler aria-hidden className="text-brand size-6" />
            <span>
              <span className="block font-bold">Gitterroste nach Maß</span>
              <span className="text-sm opacity-80">Konfigurieren &amp; Angebot anfragen</span>
            </span>
          </Link>
        )}
      </header>

      {chips.length > 0 && (
        <nav aria-label={cat.children.length ? "Unterkategorien" : "Weitere Kategorien"} className="mt-8">
          <ul className="-mx-4 flex scrollbar-none gap-2 overflow-x-auto px-4 pb-1">
            {chips.map((c) => {
              const active = c.path === cat.path;
              return (
                <li key={c.id} className="shrink-0">
                  <Link
                    href={c.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                      active ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink",
                    )}
                  >
                    {c.name}
                    {c.productCount > 0 && (
                      <span className={cn("text-xs", active ? "opacity-70" : "text-muted")}>{c.productCount}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <div className="mt-8">
        <Suspense fallback={<ListingSkeleton />}>
          <ProductListing
            base={{ categoryPath: cat.path }}
            filterKeys={cat.filterKeys}
            searchParams={searchParams}
            basePath={basePath}
          />
        </Suspense>
      </div>
    </div>
  );
}
