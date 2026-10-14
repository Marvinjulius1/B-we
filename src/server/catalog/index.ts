/**
 * Öffentliche, gecachte Katalog-API für Server Components und Route Handler.
 *
 * Alle Lesezugriffe laufen über "use cache" (Next.js Cache Components) mit dem Tag "catalog".
 * Nach einem Import invalidiert POST /api/revalidate den Tag (siehe scripts/import-products.ts).
 */
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/server/db";
import { getSearchProvider } from "@/server/search";
import { PrismaCatalogRepository } from "./prisma-repository";
import type { CatalogRepository, ProductQuery } from "./types";

export type * from "./types";

export const CATALOG_TAG = "catalog";

let repo: CatalogRepository | undefined;
/** Austauschpunkt für andere Backends (Shopware, JTL, Medusa …). */
function repository(): CatalogRepository {
  repo ??= new PrismaCatalogRepository(prisma, getSearchProvider());
  return repo;
}

export async function getCategoryTree() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return repository().getCategoryTree();
}

export async function getCategory(path: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return repository().getCategory(path);
}

export async function listProducts(query: ProductQuery) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return repository().listProducts(query);
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return repository().getProduct(slug);
}

export async function getFlaggedProducts(flag: NonNullable<ProductQuery["flag"]>, limit = 8) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return repository().getFlaggedProducts(flag, limit);
}

export async function getBrands() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return repository().getBrands();
}

export async function getBrand(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return repository().getBrand(slug);
}

export async function suggest(q: string, limit?: number) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);
  return repository().suggest(q, limit);
}

export async function listProductSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return repository().listProductSlugs();
}
