import type { NextRequest } from "next/server";
import { getCategory, listProducts, type ProductQuery } from "@/server/catalog";
import { parseListingParams, type SearchParamsRecord } from "@/lib/listing-params";

const FLAGS = new Set(["isNew", "isBestseller", "isClearance", "isTopProduct"]);

/**
 * Seitenweise Produktkarten für "Mehr laden".
 * GET /api/products?kategorie=gitterroste&maschenweite=30+x+30&seite=2
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const record: SearchParamsRecord = {};
  for (const key of new Set(sp.keys())) record[key] = sp.getAll(key);

  const categoryPath = sp.get("kategorie") ?? undefined;
  const flag = sp.get("flag") ?? undefined;
  const brandSlug = sp.get("hersteller") ?? undefined;
  const filterKeys = categoryPath ? ((await getCategory(categoryPath))?.filterKeys ?? []) : [];
  const params = parseListingParams(record, filterKeys);

  const result = await listProducts({
    categoryPath,
    brandSlug,
    flag: flag && FLAGS.has(flag) ? (flag as ProductQuery["flag"]) : undefined,
    ...params,
  });
  return Response.json({
    items: result.items,
    page: result.page,
    pageCount: result.pageCount,
    total: result.total,
  });
}
