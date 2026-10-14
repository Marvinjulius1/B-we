import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BatteryCharging, MessageCircle, Phone, Store, Truck } from "lucide-react";
import { getProduct, listProductSlugs } from "@/server/catalog";
import { isPurchasable, SHIPPING_LABELS } from "@/lib/catalog-constants";
import { formatPrice, netFromGross } from "@/lib/money";
import { site } from "@/config/site";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGallery } from "@/components/shop/product-gallery";
import { Price } from "@/components/shop/price";
import { StockStatusLine } from "@/components/shop/stock-status";
import { VariantSelector } from "@/components/shop/variant-selector";
import { BuyBoxActions } from "@/components/shop/buy-box-actions";
import { ProductRail } from "@/components/shop/product-rail";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { productSchema } from "@/components/seo/product-schema";

/** Häufig besuchte Artikel werden beim Build vorgerendert, alle weiteren beim ersten Aufruf (ISR). */
export async function generateStaticParams() {
  const slugs = await listProductSlugs();
  return slugs.slice(0, 500).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produkt/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Artikel nicht gefunden" };
  const description =
    p.metaDescription ??
    `${p.name}${p.brand ? ` von ${p.brand.name}` : ""} für ${formatPrice(p.priceGrossCents)} – ${p.shortDescription ?? "jetzt bei Böwe in Aurich bestellen"}. Lieferung ${p.deliveryTime}.`;
  return {
    title: p.metaTitle ?? p.name,
    description: description.slice(0, 160),
    alternates: { canonical: `/produkt/${p.slug}` },
    openGraph: {
      type: "website",
      title: p.name,
      description: description.slice(0, 200),
      images: [{ url: "/brand/og-default.png", width: 1200, height: 630 }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/produkt/[slug]">) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const purchasable = isPurchasable(p.stockStatus);
  const crumbs = [
    { name: "Shop", href: "/shop" },
    ...p.breadcrumbs.map((b) => ({ name: b.name, href: `/shop/${b.path}` })),
    { name: p.name, href: `/produkt/${p.slug}` },
  ];

  return (
    <div className="container-page pt-6">
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <ProductGallery images={p.images} name={p.name} />

        <div className="lg:sticky lg:top-36 lg:self-start">
          <div className="flex flex-wrap gap-2">
            {p.isClearance && <Badge tone="dark">Restposten</Badge>}
            {p.isNew && <Badge tone="brand">Neu im Sortiment</Badge>}
            {p.isBestseller && <Badge>Bestseller</Badge>}
          </div>
          {p.brand && (
            <Link
              href={`/marken/${p.brand.slug}`}
              className="text-muted hover:text-ink mt-3 inline-block text-sm font-semibold tracking-wider uppercase"
            >
              {p.brand.name}
            </Link>
          )}
          <h1 className="mt-1 text-3xl leading-tight font-extrabold md:text-4xl">{p.name}</h1>
          {p.shortDescription && <p className="text-muted mt-3 text-lg">{p.shortDescription}</p>}

          <dl className="text-muted mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <div className="flex gap-1.5">
              <dt>Art.-Nr.</dt>
              <dd className="text-ink font-medium">{p.sku}</dd>
            </div>
            {p.ean && (
              <div className="flex gap-1.5">
                <dt>EAN</dt>
                <dd className="text-ink font-medium">{p.ean}</dd>
              </div>
            )}
            {p.mpn && (
              <div className="flex gap-1.5">
                <dt>Herst.-Nr.</dt>
                <dd className="text-ink font-medium">{p.mpn}</dd>
              </div>
            )}
          </dl>

          <div className="border-line bg-surface mt-6 space-y-6 rounded-[var(--radius-tile)] border p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Price cents={p.priceGrossCents} compareAtCents={p.compareAtPriceCents} unit={p.unit} size="lg" />
              <p className="text-muted text-xs">
                {formatPrice(netFromGross(p.priceGrossCents, p.taxRate))} netto zzgl. {p.taxRate} % MwSt.
              </p>
            </div>
            <StockStatusLine status={p.stockStatus} deliveryTime={p.deliveryTime} quantity={p.stockQuantity} />
            <VariantSelector product={p} />
            <BuyBoxActions
              purchasable={purchasable}
              line={{
                sku: p.sku,
                slug: p.slug,
                name: p.name,
                image: p.images[0].url,
                unitPriceCents: p.priceGrossCents,
                shippingClass: p.shippingClass,
              }}
            />
            <ul className="border-line space-y-2 border-t pt-5 text-sm">
              <li className="flex gap-3">
                <Truck aria-hidden className="text-brand-text size-5 shrink-0" />
                <span>
                  {SHIPPING_LABELS[p.shippingClass]}
                  {p.shippingClass === "SPEDITION" && " – wir stimmen den Liefertermin telefonisch mit Ihnen ab."}
                </span>
              </li>
              <li className="flex gap-3">
                <Store aria-hidden className="text-brand-text size-5 shrink-0" />
                <span>
                  Abholung im{" "}
                  <Link href="/ladengeschaeft" className="underline underline-offset-2">
                    Ladengeschäft Aurich
                  </Link>{" "}
                  möglich
                </span>
              </li>
              {p.containsBattery && (
                <li className="flex gap-3">
                  <BatteryCharging aria-hidden className="text-brand-text size-5 shrink-0" />
                  <span>
                    Enthält Batterien/Akkus –{" "}
                    <Link href="/batteriegesetz" className="underline underline-offset-2">
                      Hinweise nach Batteriegesetz
                    </Link>
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div className="bg-surface-2 mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-5 py-4 text-sm">
            <span className="font-semibold">Fragen zum Artikel?</span>
            <a href={site.contact.phoneHref} className="inline-flex items-center gap-1.5 hover:underline">
              <Phone aria-hidden className="size-4" /> {site.contact.phoneDisplay}
            </a>
            <a
              href={site.contact.whatsappHref}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <MessageCircle aria-hidden className="size-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        {p.description && (
          <section aria-labelledby="beschreibung">
            <h2 id="beschreibung" className="text-2xl font-extrabold">
              Beschreibung
            </h2>
            <div className="mt-4 max-w-prose space-y-4 text-[1.05rem] leading-relaxed">
              {p.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        )}
        {p.attributes.length > 0 && (
          <section aria-labelledby="technische-daten">
            <h2 id="technische-daten" className="text-2xl font-extrabold">
              Technische Daten
            </h2>
            <table className="border-line mt-4 w-full overflow-hidden rounded-2xl border text-left text-[0.95rem]">
              <caption className="sr-only">Technische Daten zu {p.name}</caption>
              <tbody>
                {p.attributes.map((a) => (
                  <tr key={a.key} className="border-line odd:bg-surface even:bg-surface-2/50 border-b last:border-0">
                    <th scope="row" className="text-muted w-2/5 px-4 py-3 font-medium">
                      {a.label}
                    </th>
                    <td className="px-4 py-3">
                      {a.value}
                      {a.unit && !a.value.endsWith(a.unit) ? ` ${a.unit}` : ""}
                    </td>
                  </tr>
                ))}
                {p.weightGrams ? (
                  <tr className="odd:bg-surface even:bg-surface-2/50">
                    <th scope="row" className="text-muted px-4 py-3 font-medium">
                      Versandgewicht
                    </th>
                    <td className="px-4 py-3">
                      {(p.weightGrams / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} kg
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        )}
      </div>

      <div className="mt-20 space-y-16">
        <ProductRail id="passend-dazu" title="Passend dazu" products={p.accessories} />
        <ProductRail id="aehnliche-artikel" title="Ähnliche Artikel" products={p.related} />
      </div>

      <JsonLd data={productSchema(p)} />
    </div>
  );
}
