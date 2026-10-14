import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ListingSkeleton, ProductListing } from "@/components/shop/product-listing";
import { SearchTrigger } from "@/components/search/search-trigger";

export const metadata: Metadata = {
  title: "Suche",
  // Suchergebnisseiten nicht indexieren (Duplicate Content), Links aber verfolgen
  robots: { index: false, follow: true },
};

async function SearchHeading({ searchParams }: { searchParams: PageProps<"/suche">["searchParams"] }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim();
  return <h1 className="text-display-lg">{q ? <>Suche: „{q}“</> : "Suche"}</h1>;
}

export default function SearchPage({ searchParams }: PageProps<"/suche">) {
  return (
    <div className="container-page pt-6">
      <Breadcrumbs items={[{ name: "Suche", href: "/suche" }]} />
      <header className="mt-6 max-w-3xl space-y-6">
        <Suspense fallback={<h1 className="text-display-lg">Suche</h1>}>
          <SearchHeading searchParams={searchParams} />
        </Suspense>
        <SearchTrigger className="md:hidden" />
      </header>
      <div className="mt-10">
        <Suspense fallback={<ListingSkeleton />}>
          <ProductListing base={{}} searchParams={searchParams} basePath="/suche" />
        </Suspense>
      </div>
    </div>
  );
}
