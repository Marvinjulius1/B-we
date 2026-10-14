import type { NextRequest } from "next/server";
import { suggest } from "@/server/catalog";

/** Autovervollständigung: GET /api/search/suggest?q=gitter */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return Response.json({ products: [], categories: [], brands: [] });
  const result = await suggest(q, 6);
  return Response.json(result, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
