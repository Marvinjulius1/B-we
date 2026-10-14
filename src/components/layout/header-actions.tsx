"use client";

import Link from "next/link";
import { Heart, ShoppingBag, UserRound } from "lucide-react";
import { cartCount, useCart } from "@/stores/cart";
import { cn } from "@/lib/utils";

export function CartCount({ className }: { className?: string }) {
  const count = useCart((s) => cartCount(s.lines));
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "bg-brand text-brand-ink absolute -top-0.5 -right-0.5 min-w-5 rounded-full px-1 text-center text-[0.7rem] leading-5 font-bold tabular-nums",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function useCartLabel() {
  const count = useCart((s) => cartCount(s.lines));
  return count === 0 ? "Warenkorb, leer" : `Warenkorb, ${count} ${count === 1 ? "Artikel" : "Artikel"}`;
}

const iconLink =
  "relative inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-2";

export function HeaderActions() {
  const cartLabel = useCartLabel();
  return (
    <nav aria-label="Konto und Warenkorb" className="flex items-center gap-0.5">
      <Link href="/konto" className={cn(iconLink, "hidden md:inline-flex")} aria-label="Kundenkonto">
        <UserRound aria-hidden className="size-5" />
      </Link>
      <Link href="/merkzettel" className={cn(iconLink, "hidden md:inline-flex")} aria-label="Merkzettel">
        <Heart aria-hidden className="size-5" />
      </Link>
      <Link href="/warenkorb" className={iconLink} aria-label={cartLabel} data-cart-target>
        <ShoppingBag aria-hidden className="size-5" />
        <CartCount />
      </Link>
    </nav>
  );
}
