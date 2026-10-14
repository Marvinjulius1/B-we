import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/server/catalog";

/**
 * Invalidiert den Katalog-Cache nach einem Import:
 *   curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" http://localhost:3000/api/revalidate
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CATALOG_TAG, "max");
  return Response.json({ ok: true, revalidated: CATALOG_TAG });
}
