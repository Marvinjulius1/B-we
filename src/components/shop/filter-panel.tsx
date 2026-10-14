"use client";

import { useId } from "react";
import { formatPrice } from "@/lib/money";
import { toSearchString, type ListingParams } from "@/lib/listing-params";
import type { Facet, FacetValue } from "@/server/catalog/types";
import { Button } from "@/components/ui/button";
import { useListingNav } from "./listing-shell";
import { cn } from "@/lib/utils";

export interface FilterPanelProps {
  basePath: string;
  params: ListingParams;
  facets: Facet[];
  brandFacet: FacetValue[];
  inStockCount: number;
  priceRange: { min: number; max: number } | null;
  /** Mobil im Sheet: Absenden-Button immer sichtbar */
  variant?: "sidebar" | "sheet";
}

const VISIBLE_VALUES = 6;

/**
 * Filter als echtes GET-Formular: funktioniert ohne JavaScript (Absenden-Button),
 * mit JavaScript werden Änderungen sofort angewendet (ohne Seiten-Reload, URL bleibt teilbar).
 */
export function FilterPanel({
  basePath,
  params,
  facets,
  brandFacet,
  inStockCount,
  priceRange,
  variant = "sidebar",
}: FilterPanelProps) {
  const { navigate } = useListingNav();
  const formId = useId();

  const readForm = (form: HTMLFormElement): ListingParams => {
    const fd = new FormData(form);
    const euro = (name: string) => {
      const v = String(fd.get(name) ?? "")
        .replace(",", ".")
        .trim();
      const n = v ? Number(v) : NaN;
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
    };
    const attributes: Record<string, string[]> = {};
    for (const f of facets) {
      const vals = fd.getAll(f.key).map(String);
      if (vals.length) attributes[f.key] = vals;
    }
    return {
      ...params,
      brands: fd.getAll("marke").map(String),
      inStockOnly: fd.get("lager") === "1",
      priceMin: euro("preis_min"),
      priceMax: euro("preis_max"),
      attributes,
      page: 1,
    };
  };

  const apply = (form: HTMLFormElement) => navigate(`${basePath}${toSearchString(readForm(form))}`);

  return (
    <form
      // Neu mounten, wenn sich die Filter ändern (z. B. über die Filter-Chips) – hält Checkboxen synchron
      key={toSearchString(params)}
      id={formId}
      action={basePath}
      method="get"
      aria-label="Produkte filtern"
      className="space-y-1"
      onChange={(e) => {
        const target = e.target as unknown as HTMLInputElement;
        // Preisfelder erst beim Absenden/Verlassen anwenden
        if (target.type === "checkbox") apply(e.currentTarget);
      }}
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
    >
      {params.q && <input type="hidden" name="q" value={params.q} />}
      {params.sort !== "relevanz" && <input type="hidden" name="sortierung" value={params.sort} />}

      <FilterSection title="Verfügbarkeit">
        <Check name="lager" value="1" checked={params.inStockOnly} label="Sofort lieferbar" count={inStockCount} />
      </FilterSection>

      {brandFacet.length > 1 && (
        <FilterSection title="Marke">
          <ValueList name="marke" values={brandFacet} />
        </FilterSection>
      )}

      {priceRange && priceRange.max > priceRange.min && (
        <FilterSection title="Preis">
          <div className="flex items-end gap-2">
            <label className="text-muted flex-1 text-xs">
              von €
              <input
                name="preis_min"
                inputMode="decimal"
                defaultValue={params.priceMin !== undefined ? params.priceMin / 100 : ""}
                placeholder={String(Math.floor(priceRange.min / 100))}
                onBlur={(e) => e.currentTarget.form && apply(e.currentTarget.form)}
                className="border-line bg-surface text-ink mt-1 h-11 w-full rounded-xl border px-3 text-base"
              />
            </label>
            <label className="text-muted flex-1 text-xs">
              bis €
              <input
                name="preis_max"
                inputMode="decimal"
                defaultValue={params.priceMax !== undefined ? params.priceMax / 100 : ""}
                placeholder={String(Math.ceil(priceRange.max / 100))}
                onBlur={(e) => e.currentTarget.form && apply(e.currentTarget.form)}
                className="border-line bg-surface text-ink mt-1 h-11 w-full rounded-xl border px-3 text-base"
              />
            </label>
          </div>
          <p className="text-muted mt-2 text-xs">
            {formatPrice(priceRange.min)} – {formatPrice(priceRange.max)}
          </p>
        </FilterSection>
      )}

      {facets.map((f) => (
        <FilterSection key={f.key} title={f.unit ? `${f.label} (${f.unit})` : f.label}>
          <ValueList name={f.key} values={f.values} />
        </FilterSection>
      ))}

      {variant === "sheet" ? (
        <div className="pt-4">
          <Button type="submit" variant="dark" className="w-full">
            Filter anwenden
          </Button>
        </div>
      ) : (
        <noscript>
          <button type="submit" className="bg-ink text-bg mt-4 min-h-11 w-full rounded-full font-semibold">
            Filter anwenden
          </button>
        </noscript>
      )}
    </form>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group border-line border-b py-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between font-semibold">
        {title}
        <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

function ValueList({ name, values }: { name: string; values: FacetValue[] }) {
  const head = values.slice(0, VISIBLE_VALUES);
  const rest = values.slice(VISIBLE_VALUES);
  const restSelected = rest.some((v) => v.selected);
  return (
    <ul className="space-y-0.5">
      {head.map((v) => (
        <li key={v.value}>
          <Check name={name} value={v.value} checked={v.selected} label={v.label} count={v.count} />
        </li>
      ))}
      {rest.length > 0 && (
        <li>
          <details open={restSelected}>
            <summary className="text-brand-text cursor-pointer py-2 text-sm font-medium">Alle {values.length} anzeigen</summary>
            <ul className="space-y-0.5">
              {rest.map((v) => (
                <li key={v.value}>
                  <Check name={name} value={v.value} checked={v.selected} label={v.label} count={v.count} />
                </li>
              ))}
            </ul>
          </details>
        </li>
      )}
    </ul>
  );
}

function Check({
  name,
  value,
  checked,
  label,
  count,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  count: number;
}) {
  const disabled = count === 0 && !checked;
  return (
    <label
      className={cn(
        "hover:bg-surface-2 flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-1",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        disabled={disabled}
        className="size-5 shrink-0 rounded accent-[var(--brand)]"
      />
      <span className="flex-1 text-[0.95rem]">{label}</span>
      <span className="text-muted text-xs tabular-nums">{count}</span>
    </label>
  );
}
