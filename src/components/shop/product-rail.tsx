import type { ProductCard as ProductCardData } from "@/server/catalog/types";
import { ProductCard } from "./product-card";

/** Horizontale Produktleiste (Scroll-Snap, ohne JS). */
export function ProductRail({ title, products, id }: { title: string; products: ProductCardData[]; id?: string }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id} className="space-y-5">
      <h2 id={id} className="text-2xl font-extrabold md:text-3xl">
        {title}
      </h2>
      <ul className="-mx-4 flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto px-4 pb-2 sm:gap-4">
        {products.map((p) => (
          <li key={p.id} className="w-[70vw] max-w-[18rem] shrink-0 snap-start sm:w-64">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
