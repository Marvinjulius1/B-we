"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { useUi } from "@/stores/ui";
import { CartCount } from "./header-actions";
import { cn } from "@/lib/utils";

/**
 * Sticky Leiste für Mobilgeräte (Daumenzone): Start, Sortiment, Suche, Merkzettel, Warenkorb.
 * Touch-Ziele ≥ 48 px, respektiert die Safe-Area von iOS.
 */
export function MobileBar() {
  const pathname = usePathname();
  const setPalette = useUi((s) => s.setPaletteOpen);
  const setCategories = useUi((s) => s.setCategoriesOpen);

  const item = "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium";
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Schnellnavigation"
      className="glass border-line fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex">
        <Link
          href="/"
          className={cn(item, active("/") ? "text-ink" : "text-muted")}
          aria-current={active("/") ? "page" : undefined}
        >
          <Home aria-hidden className="size-5" />
          Start
        </Link>
        <button type="button" className={cn(item, "text-muted")} onClick={() => setCategories(true)} aria-haspopup="dialog">
          <LayoutGrid aria-hidden className="size-5" />
          Sortiment
        </button>
        <button type="button" className={cn(item, "text-ink")} onClick={() => setPalette(true)} aria-haspopup="dialog">
          <span className="bg-brand text-brand-ink flex size-10 items-center justify-center rounded-full">
            <Search aria-hidden className="size-5" />
          </span>
          <span className="sr-only">Suche</span>
        </button>
        <Link href="/merkzettel" className={cn(item, active("/merkzettel") ? "text-ink" : "text-muted")}>
          <Heart aria-hidden className="size-5" />
          Merkzettel
        </Link>
        <Link href="/warenkorb" className={cn(item, active("/warenkorb") ? "text-ink" : "text-muted")}>
          <span className="relative">
            <ShoppingBag aria-hidden className="size-5" />
            <CartCount className="-top-2 -right-3" />
          </span>
          Warenkorb
        </Link>
      </div>
    </nav>
  );
}
