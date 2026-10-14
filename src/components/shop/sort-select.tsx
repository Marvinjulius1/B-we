"use client";

import { SORT_OPTIONS, type SortOption } from "@/lib/catalog-constants";
import { toSearchString, type ListingParams } from "@/lib/listing-params";
import { useListingNav } from "./listing-shell";

export function SortSelect({ basePath, params }: { basePath: string; params: ListingParams }) {
  const { navigate } = useListingNav();
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted">Sortieren</span>
      <select
        className="border-line bg-surface min-h-11 rounded-full border px-4 pr-8 font-medium"
        value={params.sort}
        onChange={(e) => navigate(`${basePath}${toSearchString({ ...params, sort: e.target.value as SortOption, page: 1 })}`)}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
