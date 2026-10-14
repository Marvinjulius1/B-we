"use client";

import { useEffect } from "react";
import { useCart } from "@/stores/cart";
import { useAudience } from "@/stores/audience";

/** Lädt persistierte Client-Stores nach der Hydration (verhindert Hydration-Mismatch). */
export function StoreHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
    void useAudience.persist.rehydrate();
  }, []);
  return null;
}
