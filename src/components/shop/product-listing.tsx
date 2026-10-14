import Link from "next/link";
import { PackageSearch, Phone } from "lucide-react";
import { listProducts, type ProductQuery } from "@/server/catalog";
import { activeFilterCount, parseListingParams, toSearchString, type SearchParamsRecord } from "@/lib/listing-params";
import { site } from "@/config/site";
import { ProductCard } from "./product-card";
import { FilterPanel } from "./filter-panel";
import { ListingResults, ListingShell } from "./listing-shell";
import { SortSelect } from "./sort-select";
import { ActiveFilters } from "./active-filters";
import { MobileFilterButton } from "./mobile-filter-button";
import { LoadMore } from "./load-more";

export const GRID_CLASS = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4";

/**
 * Produktliste mit Facetten, Sortierung und "Mehr laden".
 * Liest searchParams → muss innerhalb von <Suspense> gerendert werden (Cache Components).
 */
export async function ProductListing({
  base,
  filterKeys = [],
  searchParams,
  basePath,
}: {
  base: Pick<ProductQuery, "categoryPath" | "flag" | "brandSlug">;
  filterKeys?: string[];
  searchParams: Promise<SearchParamsRecord>;
  basePath: string;
}) {
  const params = parseListingParams(await searchParams, filterKeys);
  const result = await listProducts({
    ...base,
    q: params.q,
    brands: params.brands,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    inStockOnly: params.inStockOnly,
    attributes: params.attributes,
    sort: params.sort,
    page: params.page,
  });

  const panelProps = {
    basePath,
    params,
    facets: result.facets,
    brandFacet: result.brandFacet,
    inStockCount: result.inStockCount,
    priceRange: result.priceRange,
  };
  const activeCount = activeFilterCount(params);

  // API-Query für "Mehr laden" (Basis + aktive Filter, ohne Seite)
  const apiBase = new URLSearchParams(toSearchString({ ...params, page: 1 }).slice(1));
  if (base.categoryPath) apiBase.set("kategorie", base.categoryPath);
  if (base.flag) apiBase.set("flag", base.flag);
  if (base.brandSlug) apiBase.set("hersteller", base.brandSlug);
  const apiQuery = apiBase.toString() ? `?${apiBase.toString()}` : "";

  return (
    <ListingShell className="grid gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="hidden lg:block" aria-label="Filter">
        <div className="sticky top-36 max-h-[calc(100dvh-10rem)] overflow-y-auto pr-2">
          <FilterPanel {...panelProps} />
        </div>
      </aside>

      <section aria-label="Artikel" className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted text-sm" aria-live="polite">
            <strong className="text-ink">{result.total}</strong> {result.total === 1 ? "Artikel" : "Artikel"}
            {params.q ? (
              <>
                {" "}
                für „<span className="text-ink">{params.q}</span>“
              </>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <MobileFilterButton {...panelProps} activeCount={activeCount} total={result.total} />
            <SortSelect basePath={basePath} params={params} />
          </div>
        </div>

        <div className="mb-5">
          <ActiveFilters basePath={basePath} params={params} facets={result.facets} brandFacet={result.brandFacet} />
        </div>

        <ListingResults>
          {result.items.length === 0 ? (
            <EmptyState hasFilters={activeCount > 0} resetHref={`${basePath}${toSearchString({ q: params.q })}`} />
          ) : (
            <>
              <ul className={GRID_CLASS}>
                {result.items.map((p, i) => (
                  <li key={p.id}>
                    <ProductCard product={p} imageLoading={i < 4 ? "eager" : "lazy"} />
                  </li>
                ))}
              </ul>
              <LoadMore
                key={apiQuery}
                apiQuery={apiQuery}
                nextHref={`${basePath}${toSearchString({ ...params, page: result.page + 1 })}`}
                page={result.page}
                pageCount={result.pageCount}
                total={result.total}
                shown={(result.page - 1) * result.pageSize + result.items.length}
                gridClassName={`${GRID_CLASS} mt-3 sm:mt-4`}
              />
            </>
          )}
        </ListingResults>
      </section>
    </ListingShell>
  );
}

function EmptyState({ hasFilters, resetHref }: { hasFilters: boolean; resetHref: string }) {
  return (
    <div className="border-line-strong bg-surface flex flex-col items-center rounded-[var(--radius-card)] border border-dashed px-6 py-14 text-center">
      <PackageSearch aria-hidden className="text-brand-text size-10" />
      <h2 className="mt-4 text-xl font-bold">
        {hasFilters ? "Keine Artikel mit diesen Filtern" : "Hier ist gerade nichts im Online-Sortiment"}
      </h2>
      <p className="text-muted mt-2 max-w-md">
        Vieles führen wir im Laden oder besorgen es kurzfristig. Rufen Sie uns an oder schreiben Sie uns per WhatsApp – wir helfen
        weiter.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {hasFilters && (
          <Link
            href={resetHref}
            className="border-line-strong inline-flex min-h-11 items-center rounded-full border px-5 font-semibold"
          >
            Filter zurücksetzen
          </Link>
        )}
        <a
          href={site.contact.phoneHref}
          className="bg-ink text-bg inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold"
        >
          <Phone aria-hidden className="size-4" /> {site.contact.phoneDisplay}
        </a>
      </div>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)]" aria-busy="true" aria-label="Artikel werden geladen">
      <div className="hidden space-y-4 lg:block">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-surface-2 h-28 animate-pulse rounded-2xl" />
        ))}
      </div>
      <div>
        <div className="bg-surface-2 mb-5 h-11 w-full animate-pulse rounded-full" />
        <div className={GRID_CLASS}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-surface-2 aspect-[3/5] animate-pulse rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
