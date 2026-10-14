"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ProductCard as ProductCardData } from "@/server/catalog/types";
import { ProductCard } from "./product-card";
import { buttonVariants } from "@/components/ui/button";

/**
 * "Mehr laden": hängt die nächste Seite an. Ohne JavaScript bleibt der Link auf ?seite=n+1 funktionsfähig
 * (Progressive Enhancement, crawlbar).
 */
export function LoadMore({
  apiQuery,
  nextHref,
  page,
  pageCount,
  total,
  shown,
  gridClassName,
}: {
  gridClassName: string;
  /** Query-String für /api/products (ohne seite) */
  apiQuery: string;
  nextHref: string;
  page: number;
  pageCount: number;
  total: number;
  shown: number;
}) {
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [current, setCurrent] = useState(page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const visible = shown + items.length;
  const hasMore = current < pageCount;

  const load = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const sep = apiQuery ? "&" : "?";
      const res = await fetch(`/api/products${apiQuery}${sep}seite=${current + 1}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { items: ProductCardData[]; page: number };
      setItems((prev) => [...prev, ...data.items]);
      setCurrent(data.page);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {items.length > 0 && (
        <ul className={gridClassName}>
          {items.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-muted text-sm" aria-live="polite">
          {visible} von {total} Artikeln
        </p>
        <div aria-hidden className="bg-surface-3 h-1 w-48 overflow-hidden rounded-full">
          <div
            className="bg-brand h-full transition-[width] duration-500"
            style={{ width: `${Math.round((visible / total) * 100)}%` }}
          />
        </div>
        {hasMore && (
          <Link
            href={nextHref.replace(/seite=\d+/, `seite=${current + 1}`)}
            onClick={load}
            className={buttonVariants({ variant: "outline", size: "lg" })}
            aria-disabled={loading}
          >
            {loading && <Loader2 aria-hidden className="animate-spin" />}
            Mehr laden
          </Link>
        )}
        {error && <p className="text-danger text-sm">Laden fehlgeschlagen – bitte erneut versuchen.</p>}
      </div>
    </>
  );
}
