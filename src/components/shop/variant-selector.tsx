import Link from "next/link";
import type { ProductDetail } from "@/server/catalog/types";
import { cn } from "@/lib/utils";

/**
 * Variantenwahl als Links (jede Variante hat eine eigene, indexierbare URL).
 * Bei mehreren Achsen wird die Variante gewählt, die in den übrigen Achsen übereinstimmt.
 */
export function VariantSelector({ product }: { product: ProductDetail }) {
  if (product.variants.length < 2 || product.variantAxes.length === 0) return null;
  const current = product.variants.find((v) => v.sku === product.sku);
  if (!current) return null;

  return (
    <div className="space-y-4">
      {product.variantAxes.map((axis) => {
        const values = [...new Set(product.variants.map((v) => v.axes[axis.key]).filter(Boolean))];
        return (
          <fieldset key={axis.key}>
            <legend className="mb-2 text-sm font-semibold">
              {axis.label}
              {axis.unit ? ` (${axis.unit})` : ""}: <span className="text-muted font-normal">{current.axes[axis.key]}</span>
            </legend>
            <ul className="flex flex-wrap gap-2">
              {values.map((value) => {
                const candidates = product.variants.filter((v) => v.axes[axis.key] === value);
                const target =
                  candidates.find((v) =>
                    product.variantAxes.every((a) => a.key === axis.key || v.axes[a.key] === current.axes[a.key]),
                  ) ?? candidates[0];
                const selected = value === current.axes[axis.key];
                const unavailable = target.stockStatus === "OUT_OF_STOCK";
                return (
                  <li key={value}>
                    <Link
                      href={`/produkt/${target.slug}`}
                      scroll={false}
                      replace
                      aria-current={selected ? "true" : undefined}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium transition-colors",
                        selected ? "border-ink bg-ink text-bg" : "border-line-strong bg-surface hover:border-ink",
                        unavailable && !selected && "text-muted line-through",
                      )}
                    >
                      {value}
                      {unavailable && <span className="sr-only"> (nicht vorrätig)</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </div>
  );
}
