/**
 * Kanonisches Importformat für Produkte.
 *
 * Jede Quelle (CSV/JSON/XML aus Warenwirtschaft oder Shopsystem, Seed-Daten, ein späterer Crawler)
 * wird zuerst in dieses Format normalisiert (siehe normalize.ts) und dann mit zod validiert.
 * Feldbeschreibung für Datenlieferanten: docs/IMPORT.md
 */
import { z } from "zod";
import { parseDecimal } from "@/lib/money";
import { SHIPPING_CLASSES, STOCK_STATUSES, TAX_RATES } from "@/lib/catalog-constants";

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());

/** Euro-Betrag; akzeptiert deutsche und englische Schreibweisen ("1.299,00", "32.50"). */
const euro = z.preprocess(
  (v) => {
    const n = parseDecimal(v);
    return n === null ? v : n;
  },
  z.number({ error: "Preis muss eine Zahl sein (z. B. 32,50)" }).nonnegative("Preis darf nicht negativ sein"),
);

const optionalEuro = z.preprocess(emptyToUndefined, euro.optional());

const flag = z.preprocess((v) => {
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1", "true", "ja", "yes", "x", "y", "j"].includes(s)) return true;
    if (["0", "false", "nein", "no", "", "n"].includes(s)) return false;
  }
  if (typeof v === "number") return v !== 0;
  return v;
}, z.boolean().default(false));

/** GTIN/EAN-8/12/13/14 inkl. Prüfziffer. */
export function isValidGtin(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export const importAttributeSchema = z.object({
  key: z.string().trim().min(1),
  label: optionalText,
  value: z.preprocess((v) => (typeof v === "number" ? String(v) : v), z.string().trim().min(1)),
  unit: optionalText,
  variantAxis: flag,
});

export const importImageSchema = z.object({
  url: z.string().trim().min(1, "Bild-URL fehlt"),
  alt: optionalText,
  source: optionalText,
  rights: optionalText,
});

export const importProductSchema = z.object({
  sku: z
    .string({ error: "Artikelnummer (SKU) fehlt" })
    .trim()
    .min(1, "Artikelnummer (SKU) fehlt")
    .max(64)
    .regex(/^[\w.\-/]+$/, "SKU darf nur Buchstaben, Ziffern, '.', '-', '_' und '/' enthalten"),
  name: z.string({ error: "Artikelname fehlt" }).trim().min(2, "Artikelname fehlt").max(200),
  slug: optionalText,
  brand: optionalText,
  /** Kategoriepfade: Slugs ("gitterroste/normroste") oder Namen ("Gitterroste > Normroste"). Erster = Primärkategorie. */
  categories: z.array(z.string().trim().min(1)).min(1, "Mindestens eine Kategorie angeben"),
  priceGross: euro,
  compareAtPrice: optionalEuro,
  taxRate: z.preprocess(
    (v) => (v === undefined || v === "" ? 19 : (parseDecimal(v) ?? v)),
    z.union(TAX_RATES.map((r) => z.literal(r)) as [z.ZodLiteral<19>, z.ZodLiteral<7>], {
      error: "MwSt.-Satz muss 19 oder 7 sein",
    }),
  ),
  unit: z.preprocess(emptyToUndefined, z.string().trim().default("Stück")),
  shippingClass: z.preprocess(emptyToUndefined, z.enum(SHIPPING_CLASSES).default("PAKET")),
  weightGrams: z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().optional()),
  stockStatus: z.preprocess(emptyToUndefined, z.enum(STOCK_STATUSES).default("IN_STOCK")),
  stockQuantity: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
  deliveryTime: optionalText,
  shortDescription: optionalText,
  description: optionalText,
  ean: z.preprocess(
    emptyToUndefined,
    z.string().trim().refine(isValidGtin, "EAN/GTIN ungültig (Länge oder Prüfziffer)").optional(),
  ),
  mpn: optionalText,
  variantGroup: optionalText,
  attributes: z.array(importAttributeSchema).default([]),
  images: z.array(importImageSchema).default([]),
  related: z.array(z.string().trim().min(1)).default([]),
  isActive: z.preprocess((v) => (v === undefined ? true : v), flag),
  isNew: flag,
  isBestseller: flag,
  isTopProduct: flag,
  isClearance: flag,
  containsBattery: flag,
  metaTitle: optionalText,
  metaDescription: optionalText,
  source: optionalText,
  rights: optionalText,
});

export type ImportProduct = z.infer<typeof importProductSchema>;
export type ImportProductInput = z.input<typeof importProductSchema>;
