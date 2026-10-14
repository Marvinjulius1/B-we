/**
 * Fachliche Konstanten des Katalogs – client- und serverseitig nutzbar.
 * Die DB speichert diese Werte als String (SQLite/PostgreSQL-neutral), hier sind sie typisiert.
 */

export const SHIPPING_CLASSES = ["PAKET", "SPEDITION"] as const;
export type ShippingClass = (typeof SHIPPING_CLASSES)[number];

export const STOCK_STATUSES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "ON_REQUEST"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const RELATION_TYPES = ["ACCESSORY", "SIMILAR"] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const TAX_RATES = [19, 7] as const;

export const STOCK_LABELS: Record<StockStatus, string> = {
  IN_STOCK: "Auf Lager",
  LOW_STOCK: "Nur noch wenige auf Lager",
  OUT_OF_STOCK: "Derzeit nicht vorrätig",
  ON_REQUEST: "Lieferbar auf Anfrage",
};

/** Lieferzeit-Standards (Briefing: Regel 2–3 Werktage, Spedition abweichend). */
export const DEFAULT_DELIVERY_TIME: Record<ShippingClass, string> = {
  PAKET: "2–3 Werktage",
  SPEDITION: "5–8 Werktage per Spedition",
};

export const SHIPPING_LABELS: Record<ShippingClass, string> = {
  PAKET: "Paketversand (DHL, DPD, UPS)",
  SPEDITION: "Speditionsversand",
};

export function isStockStatus(v: string): v is StockStatus {
  return (STOCK_STATUSES as readonly string[]).includes(v);
}

export function isShippingClass(v: string): v is ShippingClass {
  return (SHIPPING_CLASSES as readonly string[]).includes(v);
}

export function deliveryTimeFor(shippingClass: string, override?: string | null): string {
  if (override) return override;
  return isShippingClass(shippingClass) ? DEFAULT_DELIVERY_TIME[shippingClass] : DEFAULT_DELIVERY_TIME.PAKET;
}

export function isPurchasable(stockStatus: string): boolean {
  return stockStatus === "IN_STOCK" || stockStatus === "LOW_STOCK" || stockStatus === "ON_REQUEST";
}

export const SORT_OPTIONS = [
  { value: "relevanz", label: "Empfehlung" },
  { value: "preis-auf", label: "Preis aufsteigend" },
  { value: "preis-ab", label: "Preis absteigend" },
  { value: "name", label: "Name A–Z" },
  { value: "neu", label: "Neueste zuerst" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 24;
