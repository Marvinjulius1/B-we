/**
 * Einstiegspunkt der Suche: liefert den konfigurierten SearchProvider und baut den Index aus dem Katalog.
 */
import path from "node:path";
import type { PrismaClient } from "@/generated/prisma/client";
import { SqliteFtsSearch } from "./sqlite-fts";
import type { SearchDocument, SearchProvider } from "./types";

export type { SearchProvider, SearchHit, SearchDocument } from "./types";

const globalForSearch = globalThis as unknown as { searchProvider?: SearchProvider };

export function getSearchProvider(): SearchProvider {
  if (!globalForSearch.searchProvider) {
    // turbopackIgnore: Pfad wird zur Laufzeit aufgelöst (Indexdatei ist kein Build-Artefakt)
    const file = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.SEARCH_INDEX_PATH ?? "./prisma/search.db");
    globalForSearch.searchProvider = new SqliteFtsSearch(file);
  }
  return globalForSearch.searchProvider;
}

/** Erzeugt Suchdokumente für alle aktiven Artikel. */
export async function buildSearchDocuments(prisma: PrismaClient): Promise<SearchDocument[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      sku: true,
      name: true,
      shortDescription: true,
      description: true,
      ean: true,
      mpn: true,
      brand: { select: { name: true } },
      attributes: { select: { label: true, value: true, unit: true } },
      categories: { select: { category: { select: { name: true, path: true } } } },
    },
  });
  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    brand: p.brand?.name ?? "",
    categories: p.categories.map((c) => `${c.category.name} ${c.category.path.replace(/[/-]/g, " ")}`).join(" "),
    attributes: p.attributes.map((a) => `${a.label} ${a.value}${a.unit ? ` ${a.unit}` : ""}`).join(" "),
    description: [p.shortDescription, p.description].filter(Boolean).join(" "),
    codes: [p.sku, p.ean, p.mpn].filter(Boolean).join(" "),
  }));
}

export async function reindexSearch(prisma: PrismaClient): Promise<number> {
  const docs = await buildSearchDocuments(prisma);
  await getSearchProvider().reindex(docs);
  return docs.length;
}
