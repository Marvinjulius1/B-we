"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { CartLine } from "@/stores/cart";
import { MAX_QUANTITY } from "@/stores/cart";
import { formatPrice } from "@/lib/money";
import { AddToCartButton } from "./add-to-cart-button";

/**
 * Menge + "In den Warenkorb" der Produktseite.
 * Auf Mobilgeräten erscheint eine Kaufleiste, sobald der Hauptbutton aus dem Sichtbereich scrollt.
 */
export function BuyBoxActions({ line, purchasable }: { line: Omit<CartLine, "quantity">; purchasable: boolean }) {
  const [qty, setQty] = useState(1);
  const anchor = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const el = anchor.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const clamp = (n: number) => Math.max(1, Math.min(MAX_QUANTITY, Number.isFinite(n) ? Math.round(n) : 1));

  return (
    <>
      <div ref={anchor} className="flex gap-3">
        <div className="border-line-strong bg-surface inline-flex items-center rounded-full border">
          <button
            type="button"
            className="hover:bg-surface-2 inline-flex size-12 items-center justify-center rounded-full disabled:opacity-40"
            onClick={() => setQty((q) => clamp(q - 1))}
            disabled={qty <= 1}
            aria-label="Menge verringern"
          >
            <Minus aria-hidden className="size-4" />
          </button>
          <label className="sr-only" htmlFor="qty">
            Menge
          </label>
          <input
            id="qty"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(clamp(Number(e.target.value)))}
            className="w-12 bg-transparent text-center text-lg font-semibold tabular-nums outline-none"
          />
          <button
            type="button"
            className="hover:bg-surface-2 inline-flex size-12 items-center justify-center rounded-full"
            onClick={() => setQty((q) => clamp(q + 1))}
            aria-label="Menge erhöhen"
          >
            <Plus aria-hidden className="size-4" />
          </button>
        </div>
        <AddToCartButton
          className="flex-1"
          size="lg"
          line={line}
          quantity={qty}
          disabled={!purchasable}
          label={purchasable ? "In den Warenkorb" : "Derzeit nicht bestellbar"}
        />
      </div>

      {purchasable && (
        <div
          aria-hidden={!showSticky}
          className={`glass border-line fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t px-4 py-3 transition-transform duration-300 md:hidden ${
            showSticky ? "translate-y-0" : "pointer-events-none translate-y-[200%]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{line.name}</p>
              <p className="font-display text-lg font-extrabold tabular-nums">{formatPrice(line.unitPriceCents)}</p>
            </div>
            <AddToCartButton line={line} quantity={qty} tabIndex={showSticky ? 0 : -1} label="In den Warenkorb" />
          </div>
        </div>
      )}
    </>
  );
}
