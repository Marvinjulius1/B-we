import { Suspense } from "react";
import type { ProductQuery } from "@/server/catalog";
import type { SearchParamsRecord } from "@/lib/listing-params";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ListingSkeleton, ProductListing } from "@/components/shop/product-listing";

/** Gemeinsames Gerüst für "Neu im Sortiment", "Bestseller" usw. */
export function FlagListingPage({
  title,
  intro,
  href,
  flag,
  searchParams,
}: {
  title: string;
  intro: string;
  href: string;
  flag: NonNullable<ProductQuery["flag"]>;
  searchParams: Promise<SearchParamsRecord>;
}) {
  return (
    <div className="container-page pt-6">
      <Breadcrumbs items={[{ name: title, href }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="text-display-lg">{title}</h1>
        <p className="text-muted mt-4 text-lg">{intro}</p>
      </header>
      <div className="mt-10">
        <Suspense fallback={<ListingSkeleton />}>
          <ProductListing base={{ flag }} searchParams={searchParams} basePath={href} />
        </Suspense>
      </div>
    </div>
  );
}
