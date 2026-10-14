import Link from "next/link";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { toSearchString, type ListingParams } from "@/lib/listing-params";
import type { Facet, FacetValue } from "@/server/catalog/types";

/** Entfernbare Filter-Chips (reine Links → funktionieren auch ohne JavaScript). */
export function ActiveFilters({
  basePath,
  params,
  facets,
  brandFacet,
}: {
  basePath: string;
  params: ListingParams;
  facets: Facet[];
  brandFacet: FacetValue[];
}) {
  const chips: { label: string; href: string }[] = [];
  const href = (p: Partial<ListingParams>) => `${basePath}${toSearchString({ ...params, ...p, page: 1 })}`;

  if (params.inStockOnly) chips.push({ label: "Sofort lieferbar", href: href({ inStockOnly: false }) });
  for (const b of params.brands) {
    chips.push({
      label: brandFacet.find((x) => x.value === b)?.label ?? b,
      href: href({ brands: params.brands.filter((x) => x !== b) }),
    });
  }
  if (params.priceMin !== undefined || params.priceMax !== undefined) {
    const from = params.priceMin !== undefined ? formatPrice(params.priceMin) : "0 €";
    const to = params.priceMax !== undefined ? formatPrice(params.priceMax) : "∞";
    chips.push({ label: `${from} – ${to}`, href: href({ priceMin: undefined, priceMax: undefined }) });
  }
  for (const [key, values] of Object.entries(params.attributes)) {
    const facet = facets.find((f) => f.key === key);
    for (const v of values) {
      const rest = { ...params.attributes, [key]: values.filter((x) => x !== v) };
      chips.push({ label: `${facet?.label ?? key}: ${v}`, href: href({ attributes: rest }) });
    }
  }
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Aktive Filter">
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          replace
          scroll={false}
          className="bg-surface-2 hover:bg-surface-3 inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium"
        >
          {c.label}
          <X aria-hidden className="size-3.5" />
          <span className="sr-only">Filter entfernen</span>
        </Link>
      ))}
      <Link
        href={`${basePath}${toSearchString({ q: params.q, sort: params.sort })}`}
        replace
        scroll={false}
        className="text-brand-text min-h-9 px-2 text-sm font-medium underline-offset-4 hover:underline"
      >
        Alle zurücksetzen
      </Link>
    </div>
  );
}
