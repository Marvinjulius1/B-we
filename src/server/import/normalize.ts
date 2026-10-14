/**
 * Normalisiert Rohdatensätze (CSV-Zeilen, JSON-Objekte, XML-Knoten) in das kanonische Importformat.
 * Kennt gängige deutsche Spaltennamen aus Warenwirtschaften/Shopsystemen (JTL, Shopware, Sage usw.).
 */
import { slugify } from "@/lib/slugify";
import { parseDecimal } from "@/lib/money";
import type { ImportProductInput } from "./schema";

export type RawRecord = Record<string, unknown>;

export type AttributeDictionary = Record<string, { label: string; unit?: string; type?: string }>;

/** Spalten-Aliase → kanonischer Feldname. Vergleich erfolgt über slugify(Spaltenname). */
const FIELD_ALIASES: Record<string, string[]> = {
  sku: ["sku", "artikelnummer", "artnr", "art-nr", "artikel-nr", "artikelnr", "bestellnummer", "productnumber", "product-number"],
  name: ["name", "bezeichnung", "artikelname", "artikelbezeichnung", "titel", "title", "produktname"],
  slug: ["slug", "url-key", "seo-url", "urlpfad"],
  brand: ["brand", "marke", "hersteller", "manufacturer", "herstellername"],
  categories: ["categories", "category", "kategorie", "kategorien", "kategoriepfad", "warengruppe", "category-path"],
  priceGross: [
    "pricegross",
    "price-gross",
    "preis",
    "bruttopreis",
    "vk-brutto",
    "vkbrutto",
    "preis-brutto",
    "price",
    "verkaufspreis",
  ],
  compareAtPrice: ["compareatprice", "compare-at-price", "streichpreis", "uvp", "alter-preis"],
  taxRate: ["taxrate", "tax-rate", "mwst", "mwst-satz", "steuersatz", "ust", "vat"],
  unit: ["unit", "einheit", "verkaufseinheit", "mengeneinheit"],
  shippingClass: ["shippingclass", "shipping-class", "versandklasse", "versandart", "versand"],
  weightGrams: ["weightgrams", "weight-grams", "gewicht-g", "gewicht-gramm"],
  weightKg: ["weightkg", "weight-kg", "gewicht", "gewicht-kg", "versandgewicht", "artikelgewicht", "weight"],
  stockStatus: ["stockstatus", "stock-status", "lagerstatus", "verfuegbarkeit", "lieferstatus", "availability"],
  stockQuantity: ["stockquantity", "stock-quantity", "bestand", "lagerbestand", "menge", "stock"],
  deliveryTime: ["deliverytime", "delivery-time", "lieferzeit"],
  shortDescription: ["shortdescription", "short-description", "kurzbeschreibung", "kurztext"],
  description: ["description", "beschreibung", "langtext", "langbeschreibung", "artikelbeschreibung"],
  ean: ["ean", "gtin", "ean13", "barcode"],
  mpn: ["mpn", "herstellernummer", "han", "herstellerartikelnummer", "hersteller-artikelnummer", "manufacturer-number"],
  variantGroup: ["variantgroup", "variant-group", "variantengruppe", "vaterartikel", "parent-sku", "parentsku", "vater-sku"],
  attributes: ["attributes", "attribute", "merkmale", "eigenschaften", "technische-daten"],
  images: ["images", "image", "bilder", "bild", "bild-urls", "image-urls"],
  related: ["related", "zubehoer", "zubehoer-skus", "passend-dazu", "cross-selling", "crossselling"],
  isActive: ["isactive", "is-active", "aktiv", "active"],
  isNew: ["isnew", "is-new", "neu", "neuheit"],
  isBestseller: ["isbestseller", "is-bestseller", "bestseller"],
  isTopProduct: ["istopproduct", "is-top-product", "topartikel", "top-artikel", "top"],
  isClearance: ["isclearance", "is-clearance", "restposten", "fundgrube", "sonderposten"],
  containsBattery: ["containsbattery", "contains-battery", "batterie", "akku-enthalten", "enthaelt-batterie", "battdg"],
  metaTitle: ["metatitle", "meta-title", "seo-titel", "seo-title"],
  metaDescription: ["metadescription", "meta-description", "seo-beschreibung", "seo-description"],
  source: ["source", "quelle", "datenquelle"],
  rights: ["rights", "rechte", "bildrechte", "nutzungsrechte"],
};

const ALIAS_LOOKUP = new Map<string, string>();
for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
  for (const a of aliases) ALIAS_LOOKUP.set(slugify(a), field);
}

/** Spalten wie "attr:maschenweite", "Merkmal: Maschenweite [mm]", "attribute.farbe" */
const ATTRIBUTE_COLUMN = /^(?:attr|attribut|attribute|merkmal|eigenschaft)\s*[:.]\s*(.+?)(?:\s*\[(.+)\])?$/i;

const STOCK_ALIASES: Record<string, string> = {
  "in-stock": "IN_STOCK",
  "auf-lager": "IN_STOCK",
  lieferbar: "IN_STOCK",
  verfuegbar: "IN_STOCK",
  "sofort-lieferbar": "IN_STOCK",
  "low-stock": "LOW_STOCK",
  "wenige-auf-lager": "LOW_STOCK",
  "nur-noch-wenige": "LOW_STOCK",
  "out-of-stock": "OUT_OF_STOCK",
  ausverkauft: "OUT_OF_STOCK",
  "nicht-lieferbar": "OUT_OF_STOCK",
  "nicht-vorraetig": "OUT_OF_STOCK",
  "on-request": "ON_REQUEST",
  "auf-anfrage": "ON_REQUEST",
  bestellartikel: "ON_REQUEST",
};

const SHIPPING_ALIASES: Record<string, string> = {
  paket: "PAKET",
  parcel: "PAKET",
  dhl: "PAKET",
  dpd: "PAKET",
  ups: "PAKET",
  spedition: "SPEDITION",
  freight: "SPEDITION",
  sperrgut: "SPEDITION",
  palette: "SPEDITION",
};

function splitList(v: unknown, separators = /\s*[|;]\s*/): string[] {
  if (Array.isArray(v)) return v.flatMap((x) => splitList(x, separators));
  if (v === undefined || v === null) return [];
  const s = String(v).trim();
  if (!s) return [];
  return s.split(separators).filter(Boolean);
}

export function resolveAttributeKey(raw: string, dict: AttributeDictionary): string {
  const s = slugify(raw);
  if (dict[s]) return s;
  for (const [key, def] of Object.entries(dict)) {
    if (slugify(def.label) === s) return key;
  }
  return s;
}

type AttributeInput = NonNullable<ImportProductInput["attributes"]>;

function normalizeAttributes(v: unknown, dict: AttributeDictionary): AttributeInput {
  if (!v) return [];
  // { "Maschenweite": "30 x 30", ... }
  if (!Array.isArray(v) && typeof v === "object") {
    return Object.entries(v as Record<string, unknown>)
      .filter(([, val]) => val !== undefined && val !== null && String(val).trim() !== "")
      .map(([k, val]) => {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          return toAttribute({ key: k, ...(val as Record<string, unknown>) }, dict);
        }
        return toAttribute({ key: k, value: val }, dict);
      });
  }
  // "Maschenweite=30 x 30|Material=Stahl"
  if (typeof v === "string") {
    return splitList(v)
      .map((pair) => pair.split(/\s*[=:]\s*/))
      .filter((p) => p.length >= 2)
      .map(([k, ...rest]) => toAttribute({ key: k, value: rest.join(":") }, dict));
  }
  if (Array.isArray(v)) {
    return v.filter((a): a is Record<string, unknown> => !!a && typeof a === "object").map((a) => toAttribute(a, dict));
  }
  return [];
}

function toAttribute(a: Record<string, unknown>, dict: AttributeDictionary) {
  const rawKey = String(a.key ?? a.name ?? a.label ?? "");
  const key = resolveAttributeKey(rawKey, dict);
  const def = dict[key];
  const value = a.value ?? a["#text"] ?? a.wert;
  return {
    key,
    label: (a.label as string | undefined) ?? def?.label ?? rawKey,
    value: typeof value === "number" ? String(value) : (value as string),
    unit: (a.unit as string | undefined) ?? (a.einheit as string | undefined) ?? def?.unit,
    variantAxis: (a.variantAxis ?? a.variantenachse ?? false) as boolean,
  };
}

function normalizeImages(v: unknown): ImportProductInput["images"] {
  if (!v) return [];
  const list = Array.isArray(v) ? v : splitList(v, /\s*[|;\n]\s*/);
  return list
    .map((img) => {
      if (typeof img === "string") return { url: img.trim() };
      if (img && typeof img === "object") {
        const o = img as Record<string, unknown>;
        return {
          url: String(o.url ?? o.src ?? o["#text"] ?? ""),
          alt: o.alt as string | undefined,
          source: o.source as string | undefined,
          rights: o.rights as string | undefined,
        };
      }
      return { url: "" };
    })
    .filter((i) => i.url);
}

/**
 * Wandelt einen Rohdatensatz in die Eingabeform des zod-Schemas um.
 * Unbekannte Spalten werden gesammelt und als Warnung gemeldet (nicht stillschweigend verworfen).
 */
export function normalizeRecord(
  raw: RawRecord,
  dict: AttributeDictionary,
): { record: Partial<ImportProductInput> & Record<string, unknown>; unknownColumns: string[] } {
  const out: Record<string, unknown> = {};
  const columnAttributes: AttributeInput = [];
  const unknownColumns: string[] = [];

  for (const [col, value] of Object.entries(raw)) {
    const attrMatch = ATTRIBUTE_COLUMN.exec(col.trim());
    if (attrMatch) {
      if (value === undefined || value === null || String(value).trim() === "") continue;
      const key = resolveAttributeKey(attrMatch[1], dict);
      columnAttributes.push({
        key,
        label: dict[key]?.label ?? attrMatch[1].trim(),
        value: String(value).trim(),
        unit: attrMatch[2]?.trim() ?? dict[key]?.unit,
        variantAxis: false,
      });
      continue;
    }
    const field = ALIAS_LOOKUP.get(slugify(col));
    if (!field) {
      unknownColumns.push(col);
      continue;
    }
    if (out[field] === undefined || out[field] === "") out[field] = value;
  }

  // Listenfelder
  if (out.categories !== undefined) out.categories = splitList(out.categories);
  if (out.related !== undefined) out.related = splitList(out.related, /\s*[|;,]\s*/);
  out.images = normalizeImages(out.images);
  out.attributes = [...normalizeAttributes(out.attributes, dict), ...columnAttributes];

  // Variantenachsen: "variantAxes": "groesse|farbe" oder Attribut-Flag
  const axes = splitList(raw.variantAxes ?? raw.variantenachsen).map((a) => resolveAttributeKey(a, dict));
  if (axes.length) {
    for (const a of out.attributes as { key: string; variantAxis?: boolean }[]) {
      if (axes.includes(a.key)) a.variantAxis = true;
    }
  }

  // Gewicht in kg → g
  if (out.weightGrams === undefined && out.weightKg !== undefined) {
    const kg = parseDecimal(out.weightKg);
    if (kg !== null) out.weightGrams = Math.round(kg * 1000);
  }
  delete out.weightKg;

  if (typeof out.stockStatus === "string") {
    const s = slugify(out.stockStatus);
    out.stockStatus = STOCK_ALIASES[s] ?? out.stockStatus.toUpperCase();
  }
  if (typeof out.shippingClass === "string") {
    const s = slugify(out.shippingClass);
    out.shippingClass = SHIPPING_ALIASES[s] ?? out.shippingClass.toUpperCase();
  }
  if (typeof out.taxRate === "string") out.taxRate = out.taxRate.replace("%", "").trim();
  if (typeof out.ean === "number") out.ean = String(out.ean);
  if (typeof out.sku === "number") out.sku = String(out.sku);

  // Bestand ohne Status → Status ableiten
  if (out.stockStatus === undefined && out.stockQuantity !== undefined && out.stockQuantity !== "") {
    const q = Number(out.stockQuantity);
    if (Number.isFinite(q)) out.stockStatus = q <= 0 ? "OUT_OF_STOCK" : q < 5 ? "LOW_STOCK" : "IN_STOCK";
  }

  // Hilfsspalten, die bewusst ausgewertet wurden, nicht als "unbekannt" melden
  const handled = new Set(["variantAxes", "variantenachsen"]);
  return { record: out, unknownColumns: unknownColumns.filter((c) => !handled.has(c)) };
}
