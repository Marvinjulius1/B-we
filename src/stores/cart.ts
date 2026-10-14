"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Client-Warenkorb (lokal gespeichert, technisch notwendig – keine Einwilligung erforderlich).
 * Preise hier dienen nur der Anzeige; maßgeblich ist die serverseitige Neuberechnung im Checkout (Phase 2).
 */
export interface CartLine {
  sku: string;
  slug: string;
  name: string;
  image: string;
  unitPriceCents: number;
  shippingClass: "PAKET" | "SPEDITION";
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
}

export const MAX_QUANTITY = 999;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.sku === line.sku);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.sku === line.sku ? { ...l, ...line, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }] };
        }),
      setQuantity: (sku, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.sku !== sku)
              : s.lines.map((l) => (l.sku === sku ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l)),
        })),
      remove: (sku) => set((s) => ({ lines: s.lines.filter((l) => l.sku !== sku) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "boewe-cart", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity * l.unitPriceCents, 0);
