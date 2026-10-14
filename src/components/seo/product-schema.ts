import type { ProductDetail } from "@/server/catalog/types";
import { site } from "@/config/site";
import { absoluteUrl } from "./json-ld";

const AVAILABILITY: Record<ProductDetail["stockStatus"], string> = {
  IN_STOCK: "https://schema.org/InStock",
  LOW_STOCK: "https://schema.org/LimitedAvailability",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
  ON_REQUEST: "https://schema.org/PreOrder",
};

/** schema.org/Product mit Offer (Preis brutto in EUR, Verfügbarkeit). */
export function productSchema(p: ProductDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    ...(p.ean ? { gtin: p.ean } : {}),
    ...(p.mpn ? { mpn: p.mpn } : {}),
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand.name } } : {}),
    description: p.shortDescription ?? p.description ?? undefined,
    image: p.images.map((i) => absoluteUrl(i.url)),
    url: absoluteUrl(`/produkt/${p.slug}`),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/produkt/${p.slug}`),
      priceCurrency: "EUR",
      price: (p.priceGrossCents / 100).toFixed(2),
      availability: AVAILABILITY[p.stockStatus],
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: site.legalName, "@id": absoluteUrl("/#organization") },
    },
  };
}
