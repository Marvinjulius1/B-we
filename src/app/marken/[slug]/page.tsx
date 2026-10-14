import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getBrand, getBrands } from "@/server/catalog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ListingSkeleton, ProductListing } from "@/components/shop/product-listing";

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/marken/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) return { title: "Marke nicht gefunden" };
  return {
    title: `${brand.name} kaufen`,
    description: `${brand.name}-Produkte bei Böwe in Aurich: persönliche Beratung, schnelle Lieferung und Abholung im Ladengeschäft.`,
    alternates: { canonical: `/marken/${brand.slug}` },
  };
}

export default async function BrandPage({ params, searchParams }: PageProps<"/marken/[slug]">) {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) notFound();
  const href = `/marken/${brand.slug}`;
  return (
    <div className="container-page pt-6">
      <Breadcrumbs
        items={[
          { name: "Marken", href: "/marken" },
          { name: brand.name, href },
        ]}
      />
      <header className="mt-6 max-w-3xl">
        <p className="text-muted text-sm font-semibold tracking-wider uppercase">Marke</p>
        <h1 className="text-display-lg mt-1">{brand.name}</h1>
        <p className="text-muted mt-4 text-lg">
          {brand.productCount > 0
            ? `${brand.productCount} Artikel von ${brand.name} im Onlineshop – weitere im Laden oder auf Bestellung.`
            : `Artikel von ${brand.name} führen wir im Laden oder besorgen sie auf Bestellung. Sprechen Sie uns an.`}
        </p>
      </header>
      <div className="mt-10">
        <Suspense fallback={<ListingSkeleton />}>
          <ProductListing base={{ brandSlug: brand.slug }} searchParams={searchParams} basePath={href} />
        </Suspense>
      </div>
    </div>
  );
}
