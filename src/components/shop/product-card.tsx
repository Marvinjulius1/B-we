import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCard as ProductCardData } from "@/server/catalog/types";
import { isPurchasable } from "@/lib/catalog-constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";
import { Price } from "./price";
import { StockStatusLine } from "./stock-status";
import { AddToCartButton } from "./add-to-cart-button";

/**
 * Produktkarte für Listen, Slider und "Mehr laden" (server- und clientseitig renderbar).
 * Zweites Bild blendet bei Hover/Fokus ein. Variantenartikel führen zur Variantenwahl.
 */
export function ProductCard({
  product,
  className,
  imageLoading = "lazy",
}: {
  product: ProductCardData;
  className?: string;
  imageLoading?: "lazy" | "eager";
}) {
  const href = `/produkt/${product.slug}`;
  const [img1, img2] = product.images;
  const hasVariants = product.variantCount > 1;
  const canBuy = isPurchasable(product.stockStatus);

  return (
    <article
      className={cn(
        "group border-line bg-surface hover:border-line-strong relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border transition-[box-shadow,border-color,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="bg-surface-2 relative aspect-square overflow-hidden">
        <ProductImage
          src={img1.url}
          alt={img1.alt}
          fill
          sizes="(min-width: 1280px) 22rem, (min-width: 768px) 33vw, 50vw"
          loading={imageLoading}
          className="object-cover transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
        />
        {img2 && (
          <ProductImage
            src={img2.url}
            alt=""
            fill
            sizes="(min-width: 1280px) 22rem, (min-width: 768px) 33vw, 50vw"
            loading="lazy"
            className="object-cover opacity-0 transition-opacity duration-500 group-focus-within:opacity-100 group-hover:opacity-100"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.isClearance && <Badge tone="dark">Restposten</Badge>}
          {product.isNew && <Badge tone="brand">Neu</Badge>}
          {product.isBestseller && <Badge tone="neutral">Bestseller</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-h-[4.5rem]">
          {product.brand && <p className="text-muted text-xs font-semibold tracking-wider uppercase">{product.brand.name}</p>}
          <h3 className="mt-1 line-clamp-3 font-sans text-[0.95rem] leading-snug font-semibold tracking-normal">
            {/* Gesamte Karte klickbar, ohne verschachtelte Links (::after-Overlay) */}
            <Link
              href={href}
              className="focus-visible:after:outline-brand after:absolute after:inset-0 after:z-[1] focus-visible:outline-none focus-visible:after:rounded-[var(--radius-card)] focus-visible:after:outline focus-visible:after:outline-3"
            >
              {product.name}
            </Link>
          </h3>
          {hasVariants && <p className="text-muted mt-1 text-xs">{product.variantCount} Varianten</p>}
        </div>

        <div className="mt-auto space-y-3">
          <Price cents={product.priceGrossCents} fromCents={product.priceFromCents} unit={product.unit} size="sm" />
          <StockStatusLine status={product.stockStatus} deliveryTime={product.deliveryTime} />
          <div className="relative z-[2]">
            {hasVariants ? (
              <Link
                href={href}
                className="border-line-strong hover:border-ink inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border font-semibold"
              >
                Variante wählen <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : (
              <AddToCartButton
                className="w-full"
                variant={canBuy ? "primary" : "outline"}
                disabled={!canBuy}
                label={canBuy ? "In den Warenkorb" : "Nicht verfügbar"}
                line={{
                  sku: product.sku,
                  slug: product.slug,
                  name: product.name,
                  image: img1.url,
                  unitPriceCents: product.priceGrossCents,
                  shippingClass: product.shippingClass,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
