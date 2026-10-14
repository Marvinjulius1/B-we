/**
 * URL-Parameter für Produktlisten (sprechend, teilbar, ohne JS nutzbar):
 *   ?marke=stihl&marke=abus&preis=10-100&lager=1&sortierung=preis-auf&seite=2&maschenweite=30+x+30
 * Attributfilter verwenden den Attribut-Schlüssel als Parameternamen.
 */
import { SORT_OPTIONS, type SortOption } from "./catalog-constants";

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export const RESERVED_PARAMS = ["q", "marke", "preis", "lager", "sortierung", "seite"] as const;

const toArray = (v: string | string[] | undefined): string[] =>
  v === undefined
    ? []
    : (Array.isArray(v) ? v : [v])
        .flatMap((x) => x.split(","))
        .map((x) => x.trim())
        .filter(Boolean);

export interface ListingParams {
  q?: string;
  brands: string[];
  priceMin?: number;
  priceMax?: number;
  inStockOnly: boolean;
  attributes: Record<string, string[]>;
  sort: SortOption;
  page: number;
}

export function parseListingParams(sp: SearchParamsRecord, filterKeys: string[] = []): ListingParams {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  let priceMin: number | undefined;
  let priceMax: number | undefined;
  const preis = one("preis");
  // Formular ohne JavaScript sendet preis_min / preis_max (in Euro)
  const pMin = one("preis_min");
  const pMax = one("preis_max");
  if (pMin || pMax) {
    const a = pMin ? Number(pMin.replace(",", ".")) : NaN;
    const b = pMax ? Number(pMax.replace(",", ".")) : NaN;
    if (Number.isFinite(a)) priceMin = Math.round(a * 100);
    if (Number.isFinite(b)) priceMax = Math.round(b * 100);
  } else if (preis) {
    const [a, b] = preis.split("-").map((x) => (x.trim() === "" ? undefined : Number(x.replace(",", "."))));
    if (a !== undefined && Number.isFinite(a)) priceMin = Math.round(a * 100);
    if (b !== undefined && Number.isFinite(b)) priceMax = Math.round(b * 100);
  }
  const sortRaw = one("sortierung");
  const sort = (SORT_OPTIONS.some((o) => o.value === sortRaw) ? sortRaw : "relevanz") as SortOption;
  const page = Math.max(1, Math.min(500, Number.parseInt(one("seite") ?? "1", 10) || 1));

  const attributes: Record<string, string[]> = {};
  for (const key of filterKeys) {
    // Attributwerte können Kommas enthalten ("2,5 x 350 mm") → hier NICHT an Kommas trennen
    const v = sp[key];
    const values = v === undefined ? [] : (Array.isArray(v) ? v : [v]).filter(Boolean);
    if (values.length) attributes[key] = values;
  }

  return {
    q: one("q")?.trim().slice(0, 120) || undefined,
    brands: toArray(sp.marke),
    priceMin,
    priceMax,
    inStockOnly: one("lager") === "1",
    attributes,
    sort,
    page,
  };
}

/** Serialisiert Parameter zurück in einen Query-String (stabile Reihenfolge für Cache-Hits). */
export function toSearchString(p: Partial<ListingParams>): string {
  const s = new URLSearchParams();
  if (p.q) s.set("q", p.q);
  for (const b of [...(p.brands ?? [])].sort()) s.append("marke", b);
  if (p.priceMin !== undefined || p.priceMax !== undefined) {
    s.set("preis", `${p.priceMin !== undefined ? p.priceMin / 100 : ""}-${p.priceMax !== undefined ? p.priceMax / 100 : ""}`);
  }
  if (p.inStockOnly) s.set("lager", "1");
  for (const key of Object.keys(p.attributes ?? {}).sort()) {
    for (const v of [...p.attributes![key]].sort()) s.append(key, v);
  }
  if (p.sort && p.sort !== "relevanz") s.set("sortierung", p.sort);
  if (p.page && p.page > 1) s.set("seite", String(p.page));
  const str = s.toString();
  return str ? `?${str}` : "";
}

export function activeFilterCount(p: ListingParams): number {
  return (
    p.brands.length +
    (p.priceMin !== undefined || p.priceMax !== undefined ? 1 : 0) +
    (p.inStockOnly ? 1 : 0) +
    Object.values(p.attributes).reduce((n, v) => n + v.length, 0)
  );
}
